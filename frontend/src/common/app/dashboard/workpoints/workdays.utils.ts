import type { Checklist, Workpoint } from "../../../@types/workpoint";
import type { Leave } from "../../../@types/leave.type";

export const PERIOD_MAP: Record<keyof Checklist, number> = {
  morning: 0,
  noon: 1,
  evening: 2,
};

export type DayStatus = string | null;
export type StatusMatrix = DayStatus[][];

export interface WorkHourSummary {
  morning: number;
  noon: number;
  evening: number;
}

interface BuildMonthlyStatusParams {
  items: Workpoint[] | undefined;
  leaves: Leave[] | undefined;
  year: number;
  month: number;
  daysInMonth: number;
  workInSunday?: boolean;
}

export const createEmptyStatuses = (daysInMonth: number): StatusMatrix =>
  Array.from({ length: daysInMonth }, () => [null, null, null]);

export const buildMonthlyStatuses = ({
  items,
  leaves,
  year,
  month,
  daysInMonth,
  workInSunday = false,
}: BuildMonthlyStatusParams): { statuses: StatusMatrix; totalHour: WorkHourSummary } => {
  const statuses = createEmptyStatuses(daysInMonth);
  const totalHour: WorkHourSummary = { morning: 0, noon: 0, evening: 0 };

  items?.forEach((item) => {
    if (!item.createdAt || !item.checklist) return;

    const dateParts = item.createdAt.slice(0, 10).split("-");
    if (dateParts.length !== 3) return;
    const itemYear = parseInt(dateParts[0], 10);
    const itemMonth = parseInt(dateParts[1], 10) - 1;
    const itemDay = parseInt(dateParts[2], 10);

    if (itemYear !== year || itemMonth !== month) return;

    const dayIndex = itemDay - 1;
    if (dayIndex < 0 || dayIndex >= daysInMonth || !statuses[dayIndex]) return;

    // Chủ nhật (0) mà không cấu hình làm CN → toàn bộ buổi là tăng ca
    const itemDate = new Date(itemYear, itemMonth, itemDay);
    const isSunday = itemDate.getDay() === 0;
    const isDayOvertime = isSunday && !workInSunday;

    (Object.keys(item.checklist) as (keyof Checklist)[]).forEach((period) => {
      const periodData = item.checklist[period];
      if (!periodData) return;

      // Buổi tối (evening) hoặc ngày tăng ca → dùng overtime status
      const isOvertimePeriod = isDayOvertime || period === "evening";

      if (periodData.out) {
        totalHour[period] += periodData.workhour || 0;
        statuses[dayIndex][PERIOD_MAP[period]] = isOvertimePeriod ? "overtime-out" : "out";
      } else if (periodData.in) {
        statuses[dayIndex][PERIOD_MAP[period]] = isOvertimePeriod ? "overtime-in" : "in";
      } else {
        statuses[dayIndex][PERIOD_MAP[period]] = null;
      }
    });

    // Tự động nhận diện tăng ca (màu cam) nếu ca chiều check-out sau 18:00 mà chưa có bản ghi ca tối
    const noonData = item.checklist.noon;
    const eveningData = item.checklist.evening;
    if (noonData?.out?.time && !eveningData?.out) {
      try {
        const outDate = new Date(noonData.out.time);
        const outHours = outDate.getHours();
        const outMinutes = outDate.getMinutes();
        const totalMinutes = outHours * 60 + outMinutes;
        // Nếu check-out từ 18:00 trở đi (ví dụ 18:30, 20:13, 20:43)
        if (totalMinutes >= 18 * 60) {
          statuses[dayIndex][2] = "overtime-out"; // Màu cam (#FFA000) cho ca tăng ca!
          const otHours = Math.max(0.5, Number(((totalMinutes - 17.5 * 60) / 60).toFixed(2)));
          totalHour.evening += otHours;
          const originalNoonHours = noonData.workhour || 0;
          if (originalNoonHours > 4) {
            totalHour.noon -= (originalNoonHours - 4);
          }
        }
      } catch (e) {
        // ignore parse error
      }
    }
  });

  leaves?.forEach((leave) => {
    const startDate = new Date(leave.start_time);
    const endDate = new Date(leave.end_time);

    if (startDate.getFullYear() !== year || startDate.getMonth() !== month) return;

    const startDay = startDate.getDate() - 1;
    const endDay = endDate.getDate() - 1;
    const leaveStatus = `off/${leave.reason}/id:${leave.id}`;

    if (startDay === endDay) {
      if (startDay < 0 || startDay >= daysInMonth || !statuses[startDay]) return;
      if (leave.morning) statuses[startDay][0] = leaveStatus;
      if (leave.noon) statuses[startDay][1] = leaveStatus;
      return;
    }

    for (let day = startDay; day <= endDay; day += 1) {
      if (day < 0 || day >= daysInMonth || !statuses[day]) continue;
      statuses[day][0] = leaveStatus;
      statuses[day][1] = leaveStatus;
      statuses[day][2] = leaveStatus;
    }
  });

  return { statuses, totalHour };
};

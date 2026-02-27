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
}

export const createEmptyStatuses = (daysInMonth: number): StatusMatrix =>
  Array.from({ length: daysInMonth }, () => [null, null, null]);

export const buildMonthlyStatuses = ({
  items,
  leaves,
  year,
  month,
  daysInMonth,
}: BuildMonthlyStatusParams): { statuses: StatusMatrix; totalHour: WorkHourSummary } => {
  const statuses = createEmptyStatuses(daysInMonth);
  const totalHour: WorkHourSummary = { morning: 0, noon: 0, evening: 0 };

  items?.forEach((item) => {
    const dateObj = new Date(item.createdAt);
    const localTime = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);

    if (!item.checklist) return;
    if (localTime.getFullYear() !== year || localTime.getMonth() !== month) return;

    const dayIndex = localTime.getDate() - 1;
    if (dayIndex < 0 || dayIndex >= daysInMonth || !statuses[dayIndex]) return;

    (Object.keys(item.checklist) as (keyof Checklist)[]).forEach((period) => {
      const periodData = item.checklist[period];
      if (!periodData) return;

      if (periodData.out) {
        totalHour[period] += periodData.workhour || 0;
        statuses[dayIndex][PERIOD_MAP[period]] = "out";
      } else if (periodData.in) {
        statuses[dayIndex][PERIOD_MAP[period]] = "in";
      } else {
        statuses[dayIndex][PERIOD_MAP[period]] = null;
      }
    });
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

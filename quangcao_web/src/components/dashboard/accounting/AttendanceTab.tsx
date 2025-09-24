import React, { useState, useMemo } from "react";
import { Table, Button, DatePicker, message } from "antd";
import {
  useReport,
  useReportExcelAttendance,
} from "../../../common/hooks/report.hook";
import dayjs from "dayjs";
import { columnsAttendance } from "../../../common/data";
import {
  getDaysInMonth,
  mapResultToDisplay,
} from "../../../utils/convert.util";
import { useGetByKey } from "../../../common/hooks/attendance.hook";
import type { AttendanceByKey } from "../../../@types/attendance.type";
import { ViewAttendanceModal } from "./ViewAttendanceModal";

export const AttendanceTab: React.FC = () => {
  const [filterMonth, setFilterMonth] = useState<number>(dayjs().month());
  const [filterYear, setFilterYear] = useState<number>(dayjs().year());
  const [openViewAttendance, setOpenViewAttendance] = useState<boolean>(false);
  const [attendance, setAttendance] = useState<AttendanceByKey | null>(null);

  // Tính toán thời gian từ đầu tháng đến cuối tháng
  const fromDate = dayjs()
    .year(filterYear)
    .month(filterMonth)
    .date(1)
    .startOf("month")
    .valueOf();

  const toDate = dayjs()
    .year(filterYear)
    .month(filterMonth)
    .date(1)
    .endOf("month")
    .valueOf();

  const { data: report, isLoading } = useReport({
    from: fromDate,
    to: toDate,
  });

  const { mutate: reportExcel } = useReportExcelAttendance({
    from: fromDate,
    to: toDate,
  });

  const { mutate: getByKey } = useGetByKey();

  const days = Array.from(
    { length: getDaysInMonth(filterMonth, filterYear) },
    (_, i) => i + 1
  );

  // Xử lý dữ liệu từ API
  const processedData = useMemo(() => {
    if (!report || !Array.isArray(report)) return [];

    return report.map((employee, idx) => {
      const row: any = {
        key: idx + 1,
        name: employee.name || "Không có tên",
        employeeId: employee.id || `emp-${idx}`,
        _id: employee._id, // Thêm _id để sử dụng cho getByKey
      };

      // Xử lý từng ngày trong tháng
      days.forEach((day) => {
        // Sửa: filterMonth bắt đầu từ 0, nên cần +1 để có tháng thực tế
        const actualMonth = filterMonth + 1; // Chuyển từ 0-11 sang 1-12
        const dateKey = `${filterYear}${String(actualMonth).padStart(
          2,
          "0"
        )}${String(day).padStart(2, "0")}`;
        const attendance = employee.attendances?.[dateKey];

        if (attendance) {
          // Sử dụng mã kết quả từ API
          row[`d${day - 1}`] = mapResultToDisplay(attendance.result);
        } else {
          // Nếu không có dữ liệu chấm công, hiển thị "-"
          row[`d${day - 1}`] = "-";
        }

        // Set key và userId cho mỗi ngày để columnsAttendance có thể sử dụng
        row[`d${day - 1}_key`] = dateKey;
        row[`d${day - 1}_userId`] = employee._id;
      });

      return row;
    });
  }, [report, filterMonth, filterYear, days]);

  // Hàm kiểm tra có phải chủ nhật không
  const isSunday = (day: number) => {
    const date = new Date(filterYear, filterMonth, day);
    return date.getDay() === 0;
  };

  const handleViewAttendance = (key: string, userId: string) => {
    getByKey(
      { key, userId },
      {
        onSuccess: (data) => {
          setAttendance(data);
          setOpenViewAttendance(true);
        },
        onError: () => {
          message.error("Lỗi khi lấy dữ liệu điểm danh");
        },
      }
    );
  };

  return (
    <div className="!rounded-2xl !shadow-xl  !drop-shadow-md !rounded-b-none">
      <div className="!flex !gap-2 !justify-end !mb-2">
        <DatePicker
          value={dayjs().year(filterYear).month(filterMonth)}
          onChange={(date) => {
            setFilterMonth(date?.month() || 0);
            setFilterYear(date?.year() || 0);
          }}
          picker="month"
          className="!w-36 !text-base !font-semibold !border-[#00b4b6] !text-[#00b4b6] !rounded-xl !bg-white !shadow-md !drop-shadow-md"
        />
        <Button
          className="!border-[#00b4b6] !text-[#00b4b6] !rounded-xl !px-6 !font-semibold !text-base !bg-white hover:!bg-[#e0f7fa] !shadow-md !drop-shadow-md"
          onClick={() => reportExcel()}
        >
          Xuất file excel
        </Button>
      </div>
      <div className="custom-scrollbar">
        <style>{`
          .custom-scrollbar ::-webkit-scrollbar {
            height: 10px;
            background: #e0f7fa;
            border-radius: 8px;
          }
          .custom-scrollbar ::-webkit-scrollbar-thumb {
            background: #00b4b6;
            border-radius: 8px;
          }
          .custom-scrollbar ::-webkit-scrollbar-thumb:hover {
            background: #0096a6;
          }
        `}</style>
        <Table
          columns={columnsAttendance(
            filterMonth,
            filterYear,
            days,
            isSunday,
            handleViewAttendance
          )}
          dataSource={processedData}
          bordered
          pagination={false}
          scroll={{ x: 1200 }}
          className="!text-base !rounded-xl !bg-white !border-[#00b4b6] !shadow-md !drop-shadow-md"
          rowClassName={() => "!hover:bg-[#e0f7fa]"}
          loading={isLoading}
          rowKey={(_, index) => `row-${index}`}
        />
      </div>
      <div className="mt-6 p-4 bg-white/90 rounded-xl !shadow-md !drop-shadow-md !text-base">
        <div>
          <span className="font-bold">T</span>: Ngày công tháng có check in,
          check out hợp lệ
          <br />
          <span className="font-bold !text-cyan-500">T</span>: Ngày công tháng
          có check in, check out hợp lệ và tăng ca
          <br />
          <span className="font-bold !text-red-500">T</span>: Ngày công tháng
          không check in, check out
          <br />
          <span className="font-bold">K</span>: Ngày công khoán có check in,
          check out hợp lệ
          <br />
          <span className="font-bold !text-cyan-500">K</span>: Ngày công khoán
          có check in, check out hợp lệ và tăng ca
          <br />
          <span className="font-bold !text-red-500">K</span>: Ngày công khoán
          không check in, check out
          <br />
        </div>
      </div>
      <ViewAttendanceModal
        open={openViewAttendance}
        onCancel={() => setOpenViewAttendance(false)}
        attendance={attendance || null}
      />
    </div>
  );
};

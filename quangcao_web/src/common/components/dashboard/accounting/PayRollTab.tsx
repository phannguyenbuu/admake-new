import React, { useState } from "react";
import { Button, Table, DatePicker } from "antd";
import {
  useReportAttendance,
  useReportExcelCalculate,
} from "../../../common/hooks/report.hook";
import dayjs from "dayjs";
import { columnsPayRoll } from "../../../common/data";

export const PayRollTab: React.FC = () => {
  const [filterMonth, setFilterMonth] = useState<number>(dayjs().month());
  const [filterYear, setFilterYear] = useState<number>(dayjs().year());

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

  const { data: report, isLoading } = useReportAttendance({
    from: fromDate,
    to: toDate,
  });

  const { mutate: reportExcel } = useReportExcelCalculate({
    from: fromDate,
    to: toDate,
  });

  return (
    <div className="!rounded-2xl !shadow-md !drop-shadow-md !rounded-b-none">
      <div className="!pb-4 !flex !gap-2 !justify-end">
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
          className="!border-[#00b4b6] !text-[#00b4b6] !rounded-xl !px-6 !font-semibold !text-base md:!text-lg !bg-white hover:!bg-[#e0f7fa] !shadow-md !drop-shadow-md"
          onClick={() => reportExcel()}
        >
          Xuất file excel
        </Button>
      </div>
      <Table
        columns={columnsPayRoll(filterMonth, filterYear)}
        // @ts-ignore
        dataSource={report}
        bordered
        pagination={false}
        scroll={{ x: true }}
        className="!text-base md:!text-lg !rounded-xl !bg-white !border-[#00b4b6] !shadow-md !drop-shadow-md"
        rowClassName={() => "!hover:bg-[#e0f7fa]"}
        loading={isLoading}
        rowKey={(_, index) => `row-${index}`}
      />
    </div>
  );
};

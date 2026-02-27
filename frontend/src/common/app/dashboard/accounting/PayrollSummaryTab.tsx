import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useApiHost } from "../../../common/hooks/useApiHost";
import { useUser } from "../../../common/hooks/useUser";

type FilterMode = "single" | "range";

type PayrollRow = {
  user_id: string;
  full_name: string;
  phone: string;
  department: string;
  group_type: "staff" | "supplier";
  salary_base: number;
  period_work: number;
  work_hours: number;
  overtime_hours: number;
  salary_base_total: number;
  salary_overtime_total: number;
  bonus_total: number;
  punish_total: number;
  advance_total: number;
  net_salary: number;
};

type PayrollSummary = {
  from_month: string;
  to_month: string;
  total_people: number;
  total_staff: number;
  total_supplier: number;
  total_base_salary: number;
  total_overtime_salary: number;
  total_bonus: number;
  total_punish: number;
  total_advance: number;
  total_net_salary: number;
};

type PayrollResponse = {
  rows: PayrollRow[];
  summary: PayrollSummary;
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

const thisMonth = dayjs().format("YYYY-MM");

const emptySummary: PayrollSummary = {
  from_month: thisMonth,
  to_month: thisMonth,
  total_people: 0,
  total_staff: 0,
  total_supplier: 0,
  total_base_salary: 0,
  total_overtime_salary: 0,
  total_bonus: 0,
  total_punish: 0,
  total_advance: 0,
  total_net_salary: 0,
};

export default function PayrollSummaryTab() {
  const { userLeadId } = useUser();
  const [filterMode, setFilterMode] = useState<FilterMode>("single");
  const [month, setMonth] = useState(thisMonth);
  const [fromMonth, setFromMonth] = useState(thisMonth);
  const [toMonth, setToMonth] = useState(thisMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>(emptySummary);

  const durationLabel = useMemo(() => {
    if (!summary.from_month || !summary.to_month) return "Không xác định";
    if (summary.from_month === summary.to_month) {
      return dayjs(`${summary.from_month}-01`).format("MM/YYYY");
    }
    return `${dayjs(`${summary.from_month}-01`).format("MM/YYYY")} - ${dayjs(
      `${summary.to_month}-01`
    ).format("MM/YYYY")}`;
  }, [summary.from_month, summary.to_month]);

  const fetchPayrollSummary = async () => {
    if (!userLeadId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        lead: String(userLeadId),
      });

      if (filterMode === "single") {
        params.set("month", month);
      } else {
        params.set("from_month", fromMonth);
        params.set("to_month", toMonth);
      }

      const response = await fetch(`${useApiHost()}/workpoint/payroll-summary?${params.toString()}`);
      if (!response.ok) throw new Error(`Cannot fetch payroll summary: ${response.status}`);
      const data: PayrollResponse = await response.json();

      setRows(data.rows || []);
      setSummary(data.summary || emptySummary);
    } catch (error) {
      console.error("Failed to fetch payroll summary", error);
      setRows([]);
      setSummary(emptySummary);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollSummary();
  }, [filterMode, month, fromMonth, toMonth, userLeadId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-slate-500">
        Tổng hợp bảng lương nhân sự và thầu phụ theo kỳ, bao gồm lương cơ bản, tăng ca, thưởng/phạt, tạm ứng
        và thực nhận.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Kiểu lọc</span>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="single">Theo tháng</option>
            <option value="range">Theo khoảng tháng</option>
          </select>
        </div>

        {filterMode === "single" ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Tháng</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Từ tháng</span>
              <input
                type="month"
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Đến tháng</span>
              <input
                type="month"
                value={toMonth}
                onChange={(e) => setToMonth(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={fetchPayrollSummary}
          className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Tải lại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Duration</div>
          <div className="text-sm font-semibold text-slate-700">{durationLabel}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Nhân sự / Thầu phụ</div>
          <div className="text-sm font-semibold text-slate-700">
            {summary.total_staff} / {summary.total_supplier}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Tổng nhân sự tính lương</div>
          <div className="text-sm font-semibold text-slate-700">{summary.total_people}</div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
          <div className="text-xs text-teal-700">Tổng thực nhận</div>
          <div className="text-sm font-semibold text-teal-700">{formatMoney(summary.total_net_salary)} đ</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="text-slate-500 text-xs border-b bg-slate-50">
              <th className="py-3 px-3">STT</th>
              <th className="py-3 px-3">Họ tên</th>
              <th className="py-3 px-3">SĐT</th>
              <th className="py-3 px-3">Bộ phận</th>
              <th className="py-3 px-3">Nhóm</th>
              <th className="py-3 px-3">Lương cơ bản</th>
              <th className="py-3 px-3">Số buổi</th>
              <th className="py-3 px-3">Số giờ</th>
              <th className="py-3 px-3">Tăng ca (giờ)</th>
              <th className="py-3 px-3">Tiền lương</th>
              <th className="py-3 px-3">Tiền tăng ca</th>
              <th className="py-3 px-3">Thưởng</th>
              <th className="py-3 px-3">Phạt</th>
              <th className="py-3 px-3">Tạm ứng</th>
              <th className="py-3 px-3">Thực nhận</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="py-8 px-3 text-center text-slate-500" colSpan={15}>
                  Đang tải dữ liệu bảng lương...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="py-8 px-3 text-center text-slate-500" colSpan={15}>
                  Không có dữ liệu cho kỳ đã chọn.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.user_id} className="border-b last:border-0 hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-slate-600">{index + 1}</td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{row.full_name}</td>
                  <td className="py-3 px-3 text-slate-600">{row.phone || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.department || "-"}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        row.group_type === "supplier"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-cyan-50 text-cyan-700"
                      }`}
                    >
                      {row.group_type === "supplier" ? "Thầu phụ" : "Nhân sự"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base)} đ</td>
                  <td className="py-3 px-3 text-slate-600">{row.period_work}</td>
                  <td className="py-3 px-3 text-slate-600">{row.work_hours}</td>
                  <td className="py-3 px-3 text-slate-600">{row.overtime_hours}</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base_total)} đ</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_overtime_total)} đ</td>
                  <td className="py-3 px-3 text-emerald-600 font-semibold">{formatMoney(row.bonus_total)} đ</td>
                  <td className="py-3 px-3 text-rose-600 font-semibold">{formatMoney(row.punish_total)} đ</td>
                  <td className="py-3 px-3 text-amber-700 font-semibold">{formatMoney(row.advance_total)} đ</td>
                  <td className="py-3 px-3 text-teal-700 font-semibold">{formatMoney(row.net_salary)} đ</td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-slate-50 font-semibold text-slate-700">
                <td className="py-3 px-3" colSpan={9}>
                  Tổng cộng
                </td>
                <td className="py-3 px-3">{formatMoney(summary.total_base_salary)} đ</td>
                <td className="py-3 px-3">{formatMoney(summary.total_overtime_salary)} đ</td>
                <td className="py-3 px-3 text-emerald-700">{formatMoney(summary.total_bonus)} đ</td>
                <td className="py-3 px-3 text-rose-700">{formatMoney(summary.total_punish)} đ</td>
                <td className="py-3 px-3 text-amber-700">{formatMoney(summary.total_advance)} đ</td>
                <td className="py-3 px-3 text-teal-700">{formatMoney(summary.total_net_salary)} đ</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}


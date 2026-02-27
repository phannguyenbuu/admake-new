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

type GroupSummary = {
  total_people: number;
  total_base_salary: number;
  total_overtime_salary: number;
  total_bonus: number;
  total_punish: number;
  total_advance: number;
  total_net_salary: number;
};

type PayrollResponse = {
  rows?: PayrollRow[];
  staff_rows?: PayrollRow[];
  supplier_rows?: PayrollRow[];
  summary?: PayrollSummary;
  staff_summary?: GroupSummary;
  supplier_summary?: GroupSummary;
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

const emptyGroupSummary: GroupSummary = {
  total_people: 0,
  total_base_salary: 0,
  total_overtime_salary: 0,
  total_bonus: 0,
  total_punish: 0,
  total_advance: 0,
  total_net_salary: 0,
};

const normalizeNamePart = (value: string) => value.trim().replace(/\s+/g, " ");

const getVietnameseGivenName = (fullName: string) => {
  const normalized = normalizeNamePart(fullName || "");
  if (!normalized) return "";
  const parts = normalized.split(" ");
  return parts[parts.length - 1] || "";
};

function buildGroupSummary(rows: PayrollRow[]): GroupSummary {
  return {
    total_people: rows.length,
    total_base_salary: rows.reduce((sum, row) => sum + Number(row.salary_base_total || 0), 0),
    total_overtime_salary: rows.reduce((sum, row) => sum + Number(row.salary_overtime_total || 0), 0),
    total_bonus: rows.reduce((sum, row) => sum + Number(row.bonus_total || 0), 0),
    total_punish: rows.reduce((sum, row) => sum + Number(row.punish_total || 0), 0),
    total_advance: rows.reduce((sum, row) => sum + Number(row.advance_total || 0), 0),
    total_net_salary: rows.reduce((sum, row) => sum + Number(row.net_salary || 0), 0),
  };
}

function PayrollTable({
  title,
  rows,
  summary,
  isLoading,
}: {
  title: string;
  rows: PayrollRow[];
  summary: GroupSummary;
  isLoading: boolean;
}) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="px-4 py-3 border-b bg-slate-50 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm font-semibold text-slate-700">{title}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
            {"L\u01b0\u01a1ng: "}<b>{formatMoney(summary.total_base_salary)} {"\u0111"}</b>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
            {"T\u0103ng ca: "}<b>{formatMoney(summary.total_overtime_salary)} {"\u0111"}</b>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-emerald-700">
            {"Th\u01b0\u1edfng: "}<b>{formatMoney(summary.total_bonus)} {"\u0111"}</b>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-700">
            {"Ph\u1ea1t: "}<b>{formatMoney(summary.total_punish)} {"\u0111"}</b>
          </span>
          <span className="px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
            {"Th\u1ef1c nh\u1eadn: "}<b>{formatMoney(summary.total_net_salary)} {"\u0111"}</b>
          </span>
        </div>
      </div>
      <table className="w-full text-sm text-left border-collapse min-w-[1450px]">
        <thead>
          <tr className="text-slate-500 text-xs border-b bg-slate-50">
            <th className="py-3 px-3">STT</th>
            <th className="py-3 px-3">Họ tên</th>
            <th className="py-3 px-3">SĐT</th>
            <th className="py-3 px-3">Bộ phận</th>
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
              <td className="py-8 px-3 text-center text-slate-500" colSpan={14}>
                Đang tải dữ liệu bảng lương...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="py-8 px-3 text-center text-slate-500" colSpan={14}>
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
              <td className="py-3 px-3" colSpan={8}>
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
  );
}

export default function PayrollSummaryTab() {
  const { userLeadId } = useUser();
  const [filterMode, setFilterMode] = useState<FilterMode>("single");
  const [month, setMonth] = useState(thisMonth);
  const [fromMonth, setFromMonth] = useState(thisMonth);
  const [toMonth, setToMonth] = useState(thisMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<PayrollSummary>(emptySummary);
  const [staffRows, setStaffRows] = useState<PayrollRow[]>([]);
  const [supplierRows, setSupplierRows] = useState<PayrollRow[]>([]);
  const [staffSummary, setStaffSummary] = useState<GroupSummary>(emptyGroupSummary);
  const [supplierSummary, setSupplierSummary] = useState<GroupSummary>(emptyGroupSummary);

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

      const fallbackRows = data.rows || [];
      const collator = new Intl.Collator("vi", {
        sensitivity: "base",
        usage: "sort",
        numeric: true,
      });

      const compareByVietnameseName = (a: PayrollRow, b: PayrollRow) => {
        const aFull = normalizeNamePart(a.full_name || "");
        const bFull = normalizeNamePart(b.full_name || "");
        const byGivenName = collator.compare(getVietnameseGivenName(aFull), getVietnameseGivenName(bFull));
        if (byGivenName !== 0) return byGivenName;
        return collator.compare(aFull, bFull);
      };

      const nextStaffRows = [...(data.staff_rows || fallbackRows.filter((row) => row.group_type === "staff"))]
        .sort(compareByVietnameseName);
      const nextSupplierRows = [...(data.supplier_rows || fallbackRows.filter((row) => row.group_type === "supplier"))]
        .sort(compareByVietnameseName);

      setStaffRows(nextStaffRows);
      setSupplierRows(nextSupplierRows);
      setSummary(data.summary || emptySummary);
      setStaffSummary(data.staff_summary || buildGroupSummary(nextStaffRows));
      setSupplierSummary(data.supplier_summary || buildGroupSummary(nextSupplierRows));
    } catch (error) {
      console.error("Failed to fetch payroll summary", error);
      setSummary(emptySummary);
      setStaffRows([]);
      setSupplierRows([]);
      setStaffSummary(emptyGroupSummary);
      setSupplierSummary(emptyGroupSummary);
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
        Tổng hợp bảng lương nhân sự và thầu phụ theo kỳ, bao gồm lương cơ bản, tăng ca, thưởng/phạt, tạm ứng và thực nhận.
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

      <PayrollTable title="Bảng lương Nhân sự" rows={staffRows} summary={staffSummary} isLoading={isLoading} />
      <PayrollTable title="Bảng lương Thầu phụ" rows={supplierRows} summary={supplierSummary} isLoading={isLoading} />
    </div>
  );
}

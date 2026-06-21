import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { notification } from "antd";
import { useUser } from "../../../common/hooks/useUser";
import {
  AccountingService,
  type PayrollAdjustmentRow as ApiPayrollAdjustmentRow,
  type PayrollGroupSummary as GroupSummary,
  type PayrollRow,
  type PayrollSummary,
  type PayrollSummaryResponse,
} from "../../../services/accounting.service";
import { Plus, Trash2, Check, X, Pencil, ChevronDown, ChevronRight } from "lucide-react";

// ─── Bonus/Punish CRUD (localStorage) ──────────────────────────────────────────────────
type PayrollAdjustmentType = "bonus" | "punish" | "advance" | "commission" | "allowance" | "bhyt" | "bhxh" | "carry_forward" | "completed";

type BonusPunishRow = {
  id: string;
  lead_id?: number;
  user_id?: string;
  type: PayrollAdjustmentType;
  note: string;
  amount: number;
  entry_date?: string;
};

type PayrollExpandableAdjustmentType = "bonus" | "punish" | "advance" | "carry_forward";

const ADJUSTMENT_META: Record<PayrollAdjustmentType, { label: string; sign: 1 | -1 | 0; rowTone: string; badgeTone: string; textTone: string }> = {
  bonus: { label: "Thưởng", sign: 1, rowTone: "bg-green-50", badgeTone: "bg-green-200 text-green-700", textTone: "text-green-700" },
  punish: { label: "Phạt", sign: -1, rowTone: "bg-rose-50", badgeTone: "bg-rose-200 text-rose-700", textTone: "text-rose-600" },
  advance: { label: "Tạm ứng", sign: -1, rowTone: "bg-amber-50", badgeTone: "bg-amber-200 text-amber-700", textTone: "text-amber-700" },
  commission: { label: "Hoa hồng", sign: 1, rowTone: "bg-cyan-50", badgeTone: "bg-cyan-200 text-cyan-700", textTone: "text-cyan-700" },
  allowance: { label: "Phụ cấp", sign: 1, rowTone: "bg-sky-50", badgeTone: "bg-sky-200 text-sky-700", textTone: "text-sky-700" },
  bhyt: { label: "BHYT", sign: -1, rowTone: "bg-emerald-50", badgeTone: "bg-emerald-200 text-emerald-700", textTone: "text-emerald-700" },
  bhxh: { label: "BHXH", sign: -1, rowTone: "bg-fuchsia-50", badgeTone: "bg-fuchsia-200 text-fuchsia-700", textTone: "text-fuchsia-700" },
  carry_forward: { label: "Mang sang", sign: 1, rowTone: "bg-teal-50", badgeTone: "bg-teal-200 text-teal-700", textTone: "text-teal-700" },
  completed: { label: "Hoàn thành", sign: 0, rowTone: "bg-slate-50", badgeTone: "bg-slate-200 text-slate-700", textTone: "text-slate-700" },
};
type AdjustmentMeta = (typeof ADJUSTMENT_META)[PayrollAdjustmentType];
const ADJUSTMENT_OPTIONS = Object.entries(ADJUSTMENT_META) as [PayrollAdjustmentType, AdjustmentMeta][];
const PAYROLL_EXPANDABLE_TYPES: PayrollExpandableAdjustmentType[] = ["bonus", "punish", "advance", "carry_forward"];
const PAYROLL_EXPANDABLE_OPTIONS = PAYROLL_EXPANDABLE_TYPES.map((type) => [type, ADJUSTMENT_META[type]] as const);
const PAYROLL_ADJUSTMENT_EVENT = "payroll-adjustments:changed";

const normalizeApiAdjustmentRows = (rows: ApiPayrollAdjustmentRow[] = []): BonusPunishRow[] =>
  rows.map((item) => ({
    id: item.id,
    lead_id: item.lead_id,
    user_id: item.user_id,
    type: item.type,
    note: item.note || "",
    amount: Number(item.amount || 0),
    entry_date: item.entry_date,
  }));

const getUserAdjustmentRows = (rows: BonusPunishRow[], userId: string) =>
  rows.filter((item) => item.user_id === userId);

const normalizeAdjustmentRows = (value: unknown): BonusPunishRow[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): BonusPunishRow | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<BonusPunishRow> & Record<string, unknown>;
      if (typeof row.id !== "string") return null;
      if (typeof row.type !== "string" || !(row.type in ADJUSTMENT_META)) return null;
      const amount = Number(row.amount || 0);
      const normalized: BonusPunishRow = {
        id: row.id,
        type: row.type as PayrollAdjustmentType,
        note: typeof row.note === "string" ? row.note : "",
        amount: Number.isFinite(amount) ? amount : 0,
      };
      if (typeof row.entry_date === "string") normalized.entry_date = row.entry_date;
      return normalized;
    })
    .filter((item): item is BonusPunishRow => Boolean(item));
};

const getAdjustmentNet = (rows: BonusPunishRow[]) =>
  rows.reduce((sum, row) => sum + row.amount * ADJUSTMENT_META[row.type].sign, 0);

const sumAdjustments = (rows: BonusPunishRow[], ...types: PayrollAdjustmentType[]) =>
  rows.filter((row) => types.includes(row.type)).reduce((sum, row) => sum + row.amount, 0);

const getAdjustmentTotals = (rows: BonusPunishRow[]) => ({
  bonus: sumAdjustments(rows, "bonus"),
  punish: sumAdjustments(rows, "punish"),
  advance: sumAdjustments(rows, "advance"),
  commission: sumAdjustments(rows, "commission"),
  allowance: sumAdjustments(rows, "allowance"),
  bhyt: sumAdjustments(rows, "bhyt"),
  bhxh: sumAdjustments(rows, "bhxh"),
  carry_forward: sumAdjustments(rows, "carry_forward"),
  completed: sumAdjustments(rows, "completed"),
  net: getAdjustmentNet(rows),
});

const BP_KEY = (userId: string, period: string) => `bp_${userId}_${period}`;
const readStoredAdjustments = (userId: string, period: string) => {
  if (typeof window === "undefined") return [];
  try {
    return normalizeAdjustmentRows(JSON.parse(window.localStorage.getItem(BP_KEY(userId, period)) || "[]"));
  } catch {
    return [];
  }
};

function useBonusPunishLegacy(userId: string, period: string) {
  const key = BP_KEY(userId, period);
  const [rows, setRows] = useState<BonusPunishRow[]>(() => readStoredAdjustments(userId, period));
  useEffect(() => {
    setRows(readStoredAdjustments(userId, period));
  }, [userId, period]);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncRows = () => setRows(readStoredAdjustments(userId, period));
    window.addEventListener(PAYROLL_ADJUSTMENT_EVENT, syncRows as EventListener);
    return () => window.removeEventListener(PAYROLL_ADJUSTMENT_EVENT, syncRows as EventListener);
  }, [userId, period]);
  const persist = (data: BonusPunishRow[]) => {
    setRows(data);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(PAYROLL_ADJUSTMENT_EVENT, { detail: { key } }));
  };
  const add = (r: Omit<BonusPunishRow, "id">) => persist([...rows, { ...r, id: Date.now().toString(36) }]);
  const remove = (id: string) => persist(rows.filter(r => r.id !== id));
  const update = (id: string, r: Partial<BonusPunishRow>) => persist(rows.map(x => x.id === id ? { ...x, ...r } : x));
  return { rows, add, remove, update };
}

type BonusPunishStore = ReturnType<typeof useBonusPunishLegacy>;
type PayrollAdjustmentDraft = Omit<BonusPunishRow, "id" | "lead_id" | "user_id">;
type PayrollAdjustmentHandlers = {
  onCreateAdjustment: (userId: string, draft: PayrollAdjustmentDraft) => Promise<void>;
  onUpdateAdjustment: (adjustmentId: string, draft: PayrollAdjustmentDraft) => Promise<void>;
  onDeleteAdjustment: (adjustmentId: string) => Promise<void>;
};

function emptyBpDraft() {
  return { type: "bonus" as const, note: "", amount: 0, entry_date: dayjs().format("YYYY-MM-DD") };
}


type FilterMode = "single" | "range";

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const describeMoneyChangeLegacy = (baseAmount: number, manualAmount: number, sign: 1 | -1) => {
  const prefix = sign > 0 ? "+" : "-";
  const parts: string[] = [];
  if (baseAmount > 0) parts.push(`Há»‡ thá»‘ng ${prefix}${formatMoney(baseAmount)} Ä‘`);
  if (manualAmount > 0) parts.push(`Äiá»u chá»‰nh ${prefix}${formatMoney(manualAmount)} Ä‘`);
  return parts.join(" | ") || "â€”";
};

const describeMoneyChange = (baseAmount: number, manualAmount: number, sign: 1 | -1) => {
  const prefix = sign > 0 ? "+" : "-";
  const parts: string[] = [];
  if (baseAmount > 0) parts.push(`Hệ thống ${prefix}${formatMoney(baseAmount)} đ`);
  if (manualAmount > 0) parts.push(`Điều chỉnh ${prefix}${formatMoney(manualAmount)} đ`);
  return parts.join(" | ") || "-";
};

function getPayslipComputedValues(row: PayrollRow, bpRows: BonusPunishRow[]) {
  const adjustments = getAdjustmentTotals(bpRows);
  const basePunish = Math.abs(Number(row.punish_total || 0));
  return {
    adjustments,
    bonusAmount: Number(row.bonus_total || 0) + adjustments.bonus,
    punishAmount: basePunish + adjustments.punish,
    advanceAmount: Number(row.advance_total || 0) + adjustments.advance,
    commissionAmount: adjustments.commission,
    allowanceAmount: Number(row.allowance || 0) + adjustments.allowance,
    bhytAmount: Number(row.bhyt || 0) + adjustments.bhyt,
    bhxhAmount: Number(row.bhxh || 0) + adjustments.bhxh,
    adjustedNet: Number(row.net_salary || 0) + adjustments.net,
  };
}

const mergeManualAdjustment = (baseAmount: number, manualAmount: number) =>
  Number(baseAmount || 0) < 0 ? Number(baseAmount || 0) - manualAmount : Number(baseAmount || 0) + manualAmount;

function getPayrollTableComputedValues(row: PayrollRow, bpRows: BonusPunishRow[]) {
  const adjustments = getAdjustmentTotals(bpRows);
  return {
    adjustments,
    bonusAmount: Number(row.bonus_total || 0) + adjustments.bonus,
    punishAmount: mergeManualAdjustment(Number(row.punish_total || 0), adjustments.punish),
    advanceAmount: mergeManualAdjustment(Number(row.advance_total || 0), adjustments.advance),
    allowanceAmount: Number(row.allowance || 0) + adjustments.allowance,
    bhytAmount: Number(row.bhyt || 0) + adjustments.bhyt,
    bhxhAmount: Number(row.bhxh || 0) + adjustments.bhxh,
    carryForwardAmount: Number(row.carry_forward || 0) + adjustments.carry_forward,
    adjustedNet: Number(row.net_salary || 0) + adjustments.net,
  };
}

function getAdjustedGroupSummary(summary: GroupSummary, rows: PayrollRow[], period: string): GroupSummary {
  const extra = rows.reduce(
    (acc, row) => {
      const adjustments = getAdjustmentTotals(readStoredAdjustments(row.user_id, period));
      return {
        bonus: acc.bonus + adjustments.bonus,
        punish: acc.punish + adjustments.punish,
        advance: acc.advance + adjustments.advance,
        allowance: acc.allowance + adjustments.allowance,
        bhyt: acc.bhyt + adjustments.bhyt,
        bhxh: acc.bhxh + adjustments.bhxh,
        carry_forward: acc.carry_forward + adjustments.carry_forward,
        net: acc.net + adjustments.net,
      };
    },
    { bonus: 0, punish: 0, advance: 0, allowance: 0, bhyt: 0, bhxh: 0, carry_forward: 0, net: 0 },
  );

  return {
    ...summary,
    total_bonus: Number(summary.total_bonus || 0) + extra.bonus,
    total_punish: mergeManualAdjustment(Number(summary.total_punish || 0), extra.punish),
    total_advance: mergeManualAdjustment(Number(summary.total_advance || 0), extra.advance),
    total_allowance: Number(summary.total_allowance || 0) + extra.allowance,
    total_bhyt: Number(summary.total_bhyt || 0) + extra.bhyt,
    total_bhxh: Number(summary.total_bhxh || 0) + extra.bhxh,
    total_carry_forward: Number(summary.total_carry_forward || 0) + extra.carry_forward,
    total_net_salary: Number(summary.total_net_salary || 0) + extra.net,
  };
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const thisMonth = dayjs().format("YYYY-MM");

const emptySummary: PayrollSummary = {
  from_month: thisMonth, to_month: thisMonth,
  total_people: 0, total_staff: 0, total_supplier: 0,
  total_base_salary: 0, total_overtime_salary: 0,
  total_bonus: 0, total_punish: 0, total_advance: 0,
  total_allowance: 0, total_bhyt: 0, total_bhxh: 0,
  total_carry_forward: 0,
  total_net_salary: 0,
};

const emptyGroupSummary: GroupSummary = {
  total_people: 0, total_base_salary: 0, total_overtime_salary: 0,
  total_bonus: 0, total_punish: 0, total_advance: 0,
  total_allowance: 0, total_bhyt: 0, total_bhxh: 0,
  total_carry_forward: 0,
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
    total_base_salary: rows.reduce((s, r) => s + Number(r.salary_base_total || 0), 0),
    total_overtime_salary: rows.reduce((s, r) => s + Number(r.salary_overtime_total || 0), 0),
    total_bonus: rows.reduce((s, r) => s + Number(r.bonus_total || 0), 0),
    total_punish: rows.reduce((s, r) => s + Number(r.punish_total || 0), 0),
    total_advance: rows.reduce((s, r) => s + Number(r.advance_total || 0), 0),
    total_allowance: rows.reduce((s, r) => s + Number(r.allowance || 0), 0),
    total_bhyt: rows.reduce((s, r) => s + Number(r.bhyt || 0), 0),
    total_bhxh: rows.reduce((s, r) => s + Number(r.bhxh || 0), 0),
    total_carry_forward: rows.reduce((s, r) => s + Number(r.carry_forward || 0), 0),
    total_net_salary: rows.reduce((s, r) => s + Number(r.net_salary || 0), 0),
  };
}

const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth < 768;

function buildPayslipHTMLLegacy(row: PayrollRow, period: string, bpRows: BonusPunishRow[]): string {
  const fm = (v: number) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const lastDay = dayjs(`${period}-01`).endOf("month").format("DD/MM/YYYY");
  const monthLabel = dayjs(`${period}-01`).format("M/YYYY");

  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"/>
<title>Phiếu lương ${row.full_name}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;margin:20px}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #ccc;padding:5px 8px}
  .header td{border:none;font-weight:bold;padding:2px 0}
  .col-title{font-weight:bold;background:#b8cce4}
  .col-content{}
  .col-amount{font-weight:bold;text-align:right}
  .bonus-row td{background:#e2efda}
  .advance-row td{background:#fff2cc}
  .net-row td{font-weight:bold;color:#c00000;background:#fff}
  .section-row td{font-weight:bold}
</style></head><body>
<table>
  <tbody class="header">
    <tr><td colspan="3"><b>PHIẾU LƯƠNG THÁNG ${monthLabel}</b></td></tr>
    <tr><td colspan="3">TÊN NHÂN VIÊN: ${row.full_name?.toUpperCase()}</td></tr>
    <tr><td colspan="3">VỊ TRÍ: ${(row.department || "").toUpperCase()}</td></tr>
    <tr><td colspan="3">NGÀY ${lastDay}</td></tr>
    <tr><td colspan="3">SỐ TÀI KHOẢN: ${(row as any).bank_account || "—"}</td></tr>
  </tbody>
</table>
<br/>
<table>
  <thead>
    <tr>
      <th class="col-title" style="width:38%">MỤC LỤC</th>
      <th class="col-title" style="width:42%">NỘI DUNG</th>
      <th class="col-title" style="width:20%">THÀNH TIỀN</th>
    </tr>
  </thead>
  <tbody>
    <tr class="section-row">
      <td>Lương căn bản ${row.period_work || 0} CÔNG &nbsp; ${fm(row.salary_base)} Đ</td>
      <td>LÀM ĐƯỢC ${row.period_work || 0} CÔNG</td>
      <td class="col-amount">${fm(row.salary_base_total)}</td>
    </tr>
    <tr><td>Lương Hiệu Suất</td><td></td><td></td></tr>
    <tr><td>Thâm niên</td><td>Theo chế độ</td><td></td></tr>
    <tr><td>Tăng ca</td><td>${row.overtime_hours ? row.overtime_hours + " Giờ" : "Giờ"}</td>
      <td class="col-amount">${row.salary_overtime_total > 0 ? fm(row.salary_overtime_total) : ""}</td></tr>
    <tr><td>Truyền thông</td><td>Icon + Đăng bài</td><td></td></tr>
    <tr><td>Phụ cấp</td><td>${row.allowance && row.allowance > 0 ? "+" + fm(row.allowance) + " đ" : "—"}</td><td class="col-amount" style="color:#1e6fa8">${row.allowance && row.allowance > 0 ? fm(row.allowance) : ""}</td></tr>

    <tr><td>BHYT (trừ)</td><td>${row.bhyt && row.bhyt > 0 ? "-" + fm(row.bhyt) + " đ" : "—"}</td><td class="col-amount" style="color:#c00000">${row.bhyt && row.bhyt > 0 ? "-" + fm(row.bhyt) : ""}</td></tr>

    <tr><td>BHXH (trừ)</td><td>${row.bhxh && row.bhxh > 0 ? "-" + fm(row.bhxh) + " đ" : "—"}</td><td class="col-amount" style="color:#c00000">${row.bhxh && row.bhxh > 0 ? "-" + fm(row.bhxh) : ""}</td></tr>
    <tr><td>Hoa Hồng</td><td></td><td></td></tr>
${bpRows.length > 0
      ? bpRows.map(bp =>
        `    <tr style="background:${bp.type === 'bonus' ? '#e2efda' : '#ffd7d7'}">
      <td>${bp.type === 'bonus' ? 'THƯỞNG' : 'PHẠT'}: ${bp.note || ''}</td>
      <td class="col-amount" style="color:${bp.type === 'bonus' ? '#276221' : '#c00000'}">${bp.type === 'bonus' ? '+' : '-'}${fm(bp.amount)}</td>
      <td></td>
    </tr>`).join('')
      : '    <tr class="bonus-row"><td><b>THƯỞNG / PHẠT</b></td><td>Chưa có</td><td></td></tr>'}
    <tr class="advance-row">
      <td>Tạm ứng</td><td></td>
      <td class="col-amount">${row.advance_total > 0 ? fm(row.advance_total) : ""}</td>
    </tr>
    <tr class="net-row">
      <td colspan="2"><b>Thực nhận</b></td>
      <td class="col-amount" style="color:#c00000"><b>${fm(row.net_salary + bpRows.filter(b => b.type === 'bonus').reduce((s, b) => s + b.amount, 0) - bpRows.filter(b => b.type === 'punish').reduce((s, b) => s + b.amount, 0))}</b></td>
    </tr>
  </tbody>
</table>
</body></html>`;
}

function buildPayslipHTML(row: PayrollRow, period: string, bpRows: BonusPunishRow[]): string {
  const fm = (v: number) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const lastDay = dayjs(`${period}-01`).endOf("month").format("DD/MM/YYYY");
  const monthLabel = dayjs(`${period}-01`).format("M/YYYY");
  const adjustments = getAdjustmentTotals(bpRows);
  const bonusAmount = Number(row.bonus_total || 0);
  const commissionAmount = adjustments.commission;
  const allowanceAmount = Number(row.allowance || 0);
  const punishAmount = Math.abs(Number(row.punish_total || 0));
  const advanceAmount = Number(row.advance_total || 0);
  const bhytAmount = Number(row.bhyt || 0);
  const bhxhAmount = Number(row.bhxh || 0);
  const adjustedNet = Number(row.net_salary || 0);

  const adjustmentRowsHtml = bpRows.length
    ? bpRows.map((bp) => {
      const meta = ADJUSTMENT_META[bp.type];
      const note = escapeHtml((bp.note || "Điều chỉnh thủ công").trim());
      return `
        <tr class="adjust-row">
          <td>${meta.label}</td>
          <td>${note}</td>
          <td class="col-amount ${meta.sign > 0 ? "plus-text" : "minus-text"}">${meta.sign > 0 ? "+" : "-"}${fm(bp.amount)}</td>
        </tr>`;
    }).join("")
    : `
        <tr>
          <td colspan="3" class="empty-note">Chưa có điều chỉnh thêm</td>
        </tr>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Phiếu lương ${escapeHtml(row.full_name || "")}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#0f172a}
    table{border-collapse:collapse;width:100%}
    td,th{border:1px solid #cbd5e1;padding:6px 8px;vertical-align:top}
    .header td{border:none;padding:2px 0}
    .col-title{font-weight:700;background:#dbeafe}
    .col-amount{font-weight:700;text-align:right;white-space:nowrap}
    .plus-text{color:#047857}
    .minus-text{color:#be123c}
    .section-row td{font-weight:700;background:#f8fafc}
    .adjust-row td{background:#f8fafc}
    .net-row td{font-weight:700;color:#b91c1c;background:#fff7ed}
    .empty-note{text-align:center;color:#64748b;font-style:italic}
  </style>
</head>
<body>
  <table>
    <tbody class="header">
      <tr><td colspan="3"><b>PHIẾU LƯƠNG THÁNG ${monthLabel}</b></td></tr>
      <tr><td colspan="3">TÊN NHÂN VIÊN: ${escapeHtml((row.full_name || "").toUpperCase())}</td></tr>
      <tr><td colspan="3">VỊ TRÍ: ${escapeHtml((row.department || "").toUpperCase())}</td></tr>
      <tr><td colspan="3">NGÀY ${lastDay}</td></tr>
      <tr><td colspan="3">SỐ TÀI KHOẢN: ${escapeHtml(row.bank_account || "-")}</td></tr>
    </tbody>
  </table>
  <br />
  <table>
    <thead>
      <tr>
        <th class="col-title" style="width:34%">MỤC LỤC</th>
        <th class="col-title" style="width:46%">NỘI DUNG</th>
        <th class="col-title" style="width:20%">THÀNH TIỀN</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section-row">
        <td>Lương cơ bản</td>
        <td>Làm được ${row.period_work || 0} công, đơn giá ${fm(row.salary_base)} đ</td>
        <td class="col-amount">${row.salary_base_total > 0 ? fm(row.salary_base_total) : ""}</td>
      </tr>
      <tr>
        <td>Tăng ca</td>
        <td>${row.overtime_hours ? `${row.overtime_hours} giờ` : "-"}</td>
        <td class="col-amount">${row.salary_overtime_total > 0 ? fm(row.salary_overtime_total) : ""}</td>
      </tr>
      <tr>
        <td>Thưởng</td>
          <td>${bonusAmount > 0 ? `Tổng thưởng ${fm(bonusAmount)} đ` : "-"}</td>
        <td class="col-amount plus-text">${bonusAmount > 0 ? `+${fm(bonusAmount)}` : ""}</td>
      </tr>
      <tr>
        <td>Hoa hồng</td>
        <td>${commissionAmount > 0 ? `Dieu chinh +${fm(commissionAmount)} d` : "-"}</td>
        <td class="col-amount plus-text">${commissionAmount > 0 ? `+${fm(commissionAmount)}` : ""}</td>
      </tr>
      <tr>
        <td>Phụ cấp</td>
        <td>${allowanceAmount > 0 ? `Tong phu cap ${fm(allowanceAmount)} d` : "-"}</td>
        <td class="col-amount plus-text">${allowanceAmount > 0 ? `+${fm(allowanceAmount)}` : ""}</td>
      </tr>
      <tr>
        <td>Phạt</td>
        <td>${punishAmount > 0 ? `Tong phat ${fm(punishAmount)} d` : "-"}</td>
        <td class="col-amount minus-text">${punishAmount > 0 ? `-${fm(punishAmount)}` : ""}</td>
      </tr>
      <tr>
        <td>Tạm ứng</td>
          <td>${advanceAmount > 0 ? `Tổng tạm ứng ${fm(advanceAmount)} đ` : "-"}</td>
        <td class="col-amount minus-text">${advanceAmount > 0 ? `-${fm(advanceAmount)}` : ""}</td>
      </tr>
      <tr>
        <td>BHYT</td>
        <td>${bhytAmount > 0 ? `Tong BHYT ${fm(bhytAmount)} d` : "-"}</td>
        <td class="col-amount minus-text">${bhytAmount > 0 ? `-${fm(bhytAmount)}` : ""}</td>
      </tr>
      <tr>
        <td>BHXH</td>
        <td>${bhxhAmount > 0 ? `Tong BHXH ${fm(bhxhAmount)} d` : "-"}</td>
        <td class="col-amount minus-text">${bhxhAmount > 0 ? `-${fm(bhxhAmount)}` : ""}</td>
      </tr>
      <tr>
        <td>Mang sang</td>
        <td>${Number(row.carry_forward || 0) !== 0 ? `Mang sang thang truoc ${fm(Number(row.carry_forward || 0))} d` : "-"}</td>
        <td class="col-amount plus-text">${Number(row.carry_forward || 0) !== 0 ? `+${fm(Number(row.carry_forward || 0))}` : ""}</td>
      </tr>
      <tr class="section-row">
        <td colspan="3">ĐIỀU CHỈNH THÊM</td>
      </tr>
      ${adjustmentRowsHtml}
      <tr class="net-row">
        <td colspan="2">Thực nhận</td>
        <td class="col-amount">${fm(adjustedNet)}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

function PayslipModalLegacy({
  row,
  period,
  onClose,
}: {
  row: PayrollRow;
  period: string;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const monthLabel = dayjs(`${period}-01`).format("M/YYYY");
  const lastDay = dayjs(`${period}-01`).endOf("month").format("DD/MM/YYYY");
  const bp = useBonusPunishLegacy(row.user_id, period);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<BonusPunishRow, "id">>(emptyBpDraft());
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<BonusPunishRow, "id">>(emptyBpDraft());

  const totalBonus = bp.rows.filter(r => r.type === "bonus").reduce((s, r) => s + r.amount, 0);
  const totalPunish = bp.rows.filter(r => r.type === "punish").reduce((s, r) => s + r.amount, 0);
  const adjustedNet = row.net_salary + totalBonus - totalPunish;

  const handlePrint = () => {
    if (isMobile()) {
      const html = buildPayslipHTML(row, period, bp.rows);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phieu-luong-${row.full_name?.replace(/\s+/g, "-")}-${period}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Desktop: print iframe ẩn
      const html = buildPayslipHTML(row, period, bp.rows);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none";
      document.body.appendChild(iframe);
      iframe.contentDocument!.open();
      iframe.contentDocument!.write(html);
      iframe.contentDocument!.close();
      iframe.onload = () => {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    }
  };

  // Click outside to close
  const backdropRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50">
          <div>
            <div className="font-bold text-slate-800 text-sm">Phiếu Lương Tháng {monthLabel}</div>
            <div className="text-xs text-slate-500 mt-0.5">{row.full_name}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold leading-none">✕</button>
        </div>

        {/* Body */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-4">
          {/* Info header */}
          <div className="text-xs text-slate-700 space-y-0.5 mb-3 font-medium">
            <div className="text-sm font-bold text-slate-800">PHIẾU LƯƠNG THÁNG {monthLabel}</div>
            <div>TÊN NHÂN VIÊN: <span className="font-bold">{row.full_name?.toUpperCase()}</span></div>
            <div>VỊ TRÍ: <span className="font-semibold">{(row.department || "").toUpperCase()}</span></div>
            <div>NGÀY {lastDay}</div>
            <div>SỐ TÀI KHOẢN: <span className="font-semibold">{(row as any).bank_account || "—"}</span></div>
          </div>

          {/* Payslip table */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {["MỤC LỤC", "NỘI DUNG", "THÀNH TIỀN"].map((h) => (
                  <th key={h} className="border border-slate-300 px-2 py-1.5 text-left bg-blue-200 font-bold text-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Lương căn bản */}
              <tr className="font-semibold">
                <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                  Lương căn bản {row.period_work || 0} CÔNG &nbsp;
                  <span className="text-slate-600">{formatMoney(row.salary_base)} Đ</span>
                </td>
                <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">LÀM ĐƯỢC {row.period_work || 0} CÔNG</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-bold whitespace-nowrap">
                  {row.salary_base_total > 0 ? formatMoney(row.salary_base_total) : ""}
                </td>
              </tr>
              {/* Rows tĩnh */}
              {[
                { label: "Lương Hiệu Suất", content: "", amount: 0 },
                { label: "Thâm niên", content: "Theo chế độ", amount: 0 },
                {
                  label: "Tăng ca",
                  content: row.overtime_hours ? `${row.overtime_hours} Giờ` : "Giờ",
                  amount: row.salary_overtime_total,
                },


                { label: "Hoa Hồng", content: "", amount: 0 },
              ].map(({ label, content, amount }) => (
                <tr key={label}>
                  <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{label}</td>
                  <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{content}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                    {amount > 0 ? formatMoney(amount) : ""}
                  </td>
                </tr>
              ))}
              {/* Phụ cấp - luôn hiển thị */}
              <tr>
                <td className="border border-slate-300 px-2 py-1.5">Phụ cấp (+)</td>
                <td className="border border-slate-300 px-2 py-1.5 text-sky-600">
                  {(row.allowance ?? 0) > 0 ? `+${formatMoney(row.allowance!)} đ` : <span className="text-slate-300 italic text-[10px]">chưa có</span>}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-sky-600">
                  {(row.allowance ?? 0) > 0 ? formatMoney(row.allowance!) : ""}
                </td>
              </tr>
              {/* BHYT - luôn hiển thị */}
              <tr>
                <td className="border border-slate-300 px-2 py-1.5">BHYT (trừ)</td>
                <td className="border border-slate-300 px-2 py-1.5 text-rose-500">
                  {(row.bhyt ?? 0) > 0 ? `-${formatMoney(row.bhyt!)} đ` : <span className="text-slate-300 italic text-[10px]">chưa có</span>}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-rose-500">
                  {(row.bhyt ?? 0) > 0 ? `-${formatMoney(row.bhyt!)}` : ""}
                </td>
              </tr>
              {/* BHXH - luôn hiển thị */}
              <tr>
                <td className="border border-slate-300 px-2 py-1.5">BHXH (trừ)</td>
                <td className="border border-slate-300 px-2 py-1.5 text-rose-500">
                  {(row.bhxh ?? 0) > 0 ? `-${formatMoney(row.bhxh!)} đ` : <span className="text-slate-300 italic text-[10px]">chưa có</span>}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-rose-500">
                  {(row.bhxh ?? 0) > 0 ? `-${formatMoney(row.bhxh!)}` : ""}
                </td>
              </tr>
              {/* Thưởng / Phạt CRUD */}
              <tr>
                <td colSpan={3} className="border border-slate-300 px-2 py-1.5 bg-slate-50" style={{ padding: 0 }}>
                  <div className="px-2 pt-1.5 pb-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">THƯỞNG / PHẠT</span>
                      <button onClick={() => { setAddOpen(true); setDraft(emptyBpDraft()); }}
                        className="flex items-center gap-0.5 text-[10px] text-teal-600 font-semibold hover:text-teal-800 transition-colors">
                        <Plus size={11} /> Thêm
                      </button>
                    </div>
                    {bp.rows.length === 0 && !addOpen && (
                      <div className="text-[10px] text-slate-400 italic py-0.5">Chưa có khoản thưởng / phạt nào.</div>
                    )}
                    {bp.rows.map(r => (
                      <div key={r.id} className={`flex items-center gap-1.5 py-0.5 text-xs rounded px-1 mb-0.5 ${r.type === 'bonus' ? 'bg-green-50' : 'bg-rose-50'}`}>
                        {editId === r.id ? (
                          <>
                            <select value={editDraft.type} onChange={e => setEditDraft(p => ({ ...p, type: e.target.value as BonusPunishRow["type"] }))}
                              className="border border-slate-200 rounded px-1 py-0.5 text-[10px] w-32">
                              <option value="bonus">➕ Thưởng</option>
                              <option value="punish">➖ Phạt</option>
                            </select>
                            <input value={editDraft.note} onChange={e => setEditDraft(p => ({ ...p, note: e.target.value }))}
                              placeholder="Ghi chú..." className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none" />
                            <input type="number" min="0" value={editDraft.amount || ""} onChange={e => setEditDraft(p => ({ ...p, amount: Number(e.target.value) }))}
                              className="w-20 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none" placeholder="Số tiền" />
                            <button onClick={() => { bp.update(r.id, editDraft); setEditId(null); }} className="text-teal-500 hover:text-teal-700"><Check size={11} /></button>
                            <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600"><X size={11} /></button>
                          </>
                        ) : (
                          <>
                            <span className={`font-bold text-[10px] ${r.type === 'bonus' ? 'text-green-700' : 'text-rose-600'}`}>
                              {r.type === 'bonus' ? '+ ' : '- '}{formatMoney(r.amount)} đ
                            </span>
                            <span className="flex-1 text-slate-600 text-[10px]">{r.note}</span>
                            <button onClick={() => { setEditId(r.id); setEditDraft({ type: r.type, note: r.note, amount: r.amount }); }}
                              className="text-slate-300 hover:text-slate-600 transition-colors"><Pencil size={10} /></button>
                            <button onClick={() => bp.remove(r.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={10} /></button>
                          </>
                        )}
                      </div>
                    ))}
                    {addOpen && (
                      <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-200">
                        <select value={draft.type} onChange={e => setDraft(p => ({ ...p, type: e.target.value as BonusPunishRow["type"] }))}
                          className="border border-slate-200 rounded px-1 py-0.5 text-[10px] w-32">
                          <option value="bonus">➕ Thưởng</option>
                          <option value="punish">➖ Phạt</option>
                        </select>
                        <input value={draft.note} onChange={e => setDraft(p => ({ ...p, note: e.target.value }))}
                          placeholder="Ghi chú..." className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none" />
                        <input type="number" min="0" value={draft.amount || ""} onChange={e => setDraft(p => ({ ...p, amount: Number(e.target.value) }))}
                          className="w-20 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none" placeholder="Số tiền"
                          onKeyDown={e => { if (e.key === 'Enter' && draft.amount > 0) { bp.add(draft); setAddOpen(false); setDraft(emptyBpDraft()); } }} />
                        <button onClick={() => { if (draft.amount > 0) { bp.add(draft); setAddOpen(false); setDraft(emptyBpDraft()); } }}
                          disabled={draft.amount <= 0} className="text-teal-500 hover:text-teal-700 disabled:opacity-40"><Check size={11} /></button>
                        <button onClick={() => setAddOpen(false)} className="text-slate-400"><X size={11} /></button>
                      </div>
                    )}
                    {bp.rows.length > 0 && (
                      <div className="flex justify-between text-[10px] font-semibold mt-1 pt-0.5 border-t border-slate-200">
                        <span className="text-green-700">+{formatMoney(totalBonus)} đ</span>
                        <span className="text-rose-600">-{formatMoney(totalPunish)} đ</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              {/* Tạm ứng */}
              <tr className="bg-yellow-100">
                <td className="border border-slate-300 px-2 py-1.5">Tạm ứng</td>
                <td className="border border-slate-300 px-2 py-1.5"></td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-amber-700">
                  {row.advance_total > 0 ? formatMoney(row.advance_total) : ""}
                </td>
              </tr>
              {/* Thực nhận (có cộng thưởng/phạt) */}
              <tr>
                <td colSpan={2} className="border border-slate-300 px-2 py-2 font-bold text-slate-800">Thực nhận</td>
                <td className="border border-slate-300 px-2 py-2 text-right font-bold text-red-600 text-sm">
                  {formatMoney(adjustedNet)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Bỏ qua
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-sm rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <span>🖨</span> In bảng lương
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PayrollTable ─────────────────────────────────────────────────────────────

function PayslipModal({
  row,
  period,
  adjustmentRows,
  onCreateAdjustment,
  onUpdateAdjustment,
  onDeleteAdjustment,
  onClose,
}: {
  row: PayrollRow;
  period: string;
  adjustmentRows?: BonusPunishRow[];
  onCreateAdjustment?: PayrollAdjustmentHandlers["onCreateAdjustment"];
  onUpdateAdjustment?: PayrollAdjustmentHandlers["onUpdateAdjustment"];
  onDeleteAdjustment?: PayrollAdjustmentHandlers["onDeleteAdjustment"];
  onClose: () => void;
}) {
  const monthLabel = dayjs(`${period}-01`).format("M/YYYY");
  const lastDay = dayjs(`${period}-01`).endOf("month").format("DD/MM/YYYY");
  const adjustmentList = adjustmentRows || [];
  const createAdjustment = onCreateAdjustment || (async () => undefined);
  const updateAdjustment = onUpdateAdjustment || (async () => undefined);
  const deleteAdjustment = onDeleteAdjustment || (async () => undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<PayrollAdjustmentDraft>(emptyBpDraft());
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PayrollAdjustmentDraft>(emptyBpDraft());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const completedItem = adjustmentList.find((item) => item.type === "completed");
  const isCompleted = !!completedItem && completedItem.amount > 0;

  const handleToggleCompleted = async () => {
    if (isCompleted) {
      if (completedItem) {
        await deleteAdjustment(completedItem.id);
      }
    } else {
      await createAdjustment(row.user_id, {
        type: "completed" as any,
        amount: 1,
        note: "Đã hoàn thành lương",
        entry_date: `${period}-01`,
      });
    }
  };

  const backdropRef = useRef<HTMLDivElement>(null);

  const adjustments = getAdjustmentTotals(adjustmentList);
  const bonusAmount = Number(row.bonus_total || 0);
  const punishAmount = Math.abs(Number(row.punish_total || 0));
  const advanceAmount = Number(row.advance_total || 0);
  const commissionAmount = adjustments.commission;
  const allowanceAmount = Number(row.allowance || 0);
  const bhytAmount = Number(row.bhyt || 0);
  const bhxhAmount = Number(row.bhxh || 0);
  const adjustedNet = Number(row.net_salary || 0);

  const saveDraft = async () => {
    if (draft.amount <= 0) return;
    setSavingKey("create");
    try {
      await createAdjustment(row.user_id, draft);
      setAddOpen(false);
      setDraft(emptyBpDraft());
    } finally {
      setSavingKey(null);
    }
  };

  const handlePrint = () => {
    const html = buildPayslipHTML(row, period, adjustmentList);
    if (isMobile()) {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phieu-luong-${row.full_name?.replace(/\s+/g, "-")}-${period}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none";
    document.body.appendChild(iframe);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const adjustmentSummary = ADJUSTMENT_OPTIONS
    .map(([type, meta]) => ({ type, meta, amount: adjustments[type] }))
    .filter((item) => item.type !== "completed" && item.amount > 0);

  const payslipRows = [
    {
      label: "Lương cơ bản",
      content: `Làm được ${row.period_work || 0} công, đơn giá ${formatMoney(row.salary_base)} đ`,
      amount: Number(row.salary_base_total || 0),
      tone: "text-slate-700",
      prefix: "",
    },
    {
      label: "Tăng ca",
      content: row.overtime_hours ? `${row.overtime_hours} giờ` : "-",
      amount: Number(row.salary_overtime_total || 0),
      tone: "text-slate-700",
      prefix: "",
    },
    {
      label: "Thưởng",
      content: describeMoneyChange(Number(row.bonus_total || 0), adjustments.bonus, 1),
      amount: bonusAmount,
      tone: "text-emerald-700",
      prefix: "+",
    },
    {
      label: "Hoa hồng",
      content: describeMoneyChange(0, adjustments.commission, 1),
      amount: commissionAmount,
      tone: "text-cyan-700",
      prefix: "+",
    },
    {
      label: "Phụ cấp",
      content: describeMoneyChange(Number(row.allowance || 0), adjustments.allowance, 1),
      amount: allowanceAmount,
      tone: "text-sky-700",
      prefix: "+",
    },
    {
      label: "Phạt",
      content: describeMoneyChange(Math.abs(Number(row.punish_total || 0)), adjustments.punish, -1),
      amount: punishAmount,
      tone: "text-rose-600",
      prefix: "-",
    },
    {
      label: "Tạm ứng",
      content: describeMoneyChange(Number(row.advance_total || 0), adjustments.advance, -1),
      amount: advanceAmount,
      tone: "text-amber-700",
      prefix: "-",
    },
    {
      label: "BHYT",
      content: describeMoneyChange(Number(row.bhyt || 0), adjustments.bhyt, -1),
      amount: bhytAmount,
      tone: "text-rose-600",
      prefix: "-",
    },
    {
      label: "BHXH",
      content: describeMoneyChange(Number(row.bhxh || 0), adjustments.bhxh, -1),
      amount: bhxhAmount,
      tone: "text-rose-600",
      prefix: "-",
    },
    {
      label: "Mang sang",
      content: describeMoneyChange(Number(row.carry_forward || 0), adjustments.carry_forward, 1),
      amount: Number(row.carry_forward || 0),
      tone: "text-teal-600",
      prefix: "+",
    },
  ];

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50">
          <div>
            <div className="font-bold text-slate-800 text-sm">Phiếu Lương Tháng {monthLabel}</div>
            <div className="text-xs text-slate-500 mt-0.5">{row.full_name}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleCompleted}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCompleted
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              {isCompleted ? <Check size={13} /> : <X size={13} />}
              {isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold leading-none">x</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-slate-700 space-y-0.5 mb-3 font-medium">
            <div className="text-sm font-bold text-slate-800">PHIẾU LƯƠNG THÁNG {monthLabel}</div>
            <div>TÊN NHÂN VIÊN: <span className="font-bold">{row.full_name?.toUpperCase()}</span></div>
            <div>VỊ TRÍ: <span className="font-semibold">{(row.department || "").toUpperCase()}</span></div>
            <div>NGÀY {lastDay}</div>
            <div>SỐ TÀI KHOẢN: <span className="font-semibold">{row.bank_account || "-"}</span></div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {["MỤC LỤC", "NỘI DUNG", "THÀNH TIỀN"].map((h) => (
                  <th key={h} className="border border-slate-300 px-2 py-1.5 text-left bg-blue-200 font-bold text-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payslipRows.map((item) => (
                <tr key={item.label}>
                  <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{item.label}</td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {item.content === "-" ? (
                        <span className="text-slate-300 italic text-[10px]">chưa có</span>
                    ) : (
                      item.content
                    )}
                  </td>
                  <td className={`border border-slate-300 px-2 py-1.5 text-right font-semibold whitespace-nowrap ${item.tone}`}>
                    {item.amount > 0 ? `${item.prefix}${formatMoney(item.amount)}` : ""}
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan={3} className="border border-slate-300 px-2 py-1.5 bg-slate-50" style={{ padding: 0 }}>
                  <div className="px-2 pt-1.5 pb-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">ĐIỀU CHỈNH THÊM</span>
                      <button
                        onClick={() => { setAddOpen(true); setDraft(emptyBpDraft()); }}
                        className="flex items-center gap-0.5 text-[10px] text-teal-600 font-semibold hover:text-teal-800 transition-colors"
                      >
                        <Plus size={11} /> Thêm
                      </button>
                    </div>
                    {(() => {
                      const displayList = adjustmentList.filter(item => item.type !== "completed");
                      return (
                        <>
                          {displayList.length === 0 && !addOpen && (
                            <div className="text-[10px] text-slate-400 italic py-0.5">Chưa có khoản điều chỉnh nào.</div>
                          )}
                          {displayList.map((item) => {
                            const meta = ADJUSTMENT_META[item.type];
                            if (!meta) return null;
                            return (
                              <div key={item.id} className={`flex items-center gap-1.5 py-1 text-xs rounded px-1 mb-1 ${meta.rowTone}`}>
                                {editId === item.id ? (
                                  <>
                                    <select
                                      value={editDraft.type}
                                      onChange={(e) => setEditDraft((prev) => ({ ...prev, type: e.target.value as PayrollAdjustmentType }))}
                                      className="border border-slate-200 rounded px-1 py-0.5 text-[10px] w-32"
                                    >
                                      {ADJUSTMENT_OPTIONS.filter(([t]) => t !== "completed").map(([type, optionMeta]) => (
                                        <option key={type} value={type}>
                                          {optionMeta.sign > 0 ? "+ " : "- "}{optionMeta.label}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="date"
                                      value={editDraft.entry_date || ""}
                                      onChange={(e) => setEditDraft((prev) => ({ ...prev, entry_date: e.target.value }))}
                                      className="border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none"
                                    />
                                    <input
                                      value={editDraft.note}
                                      onChange={(e) => setEditDraft((prev) => ({ ...prev, note: e.target.value }))}
                                      placeholder="Ghi chú..."
                                      className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={editDraft.amount || ""}
                                      onChange={(e) => setEditDraft((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                                      className="w-24 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none"
                                      placeholder="Số tiền"
                                    />
                                    <button
                                      onClick={async () => {
                                        if (editDraft.amount > 0) {
                                          setSavingKey(item.id);
                                          try {
                                            await updateAdjustment(item.id, editDraft);
                                            setEditId(null);
                                          } finally {
                                            setSavingKey(null);
                                          }
                                        }
                                      }}
                                      disabled={savingKey === item.id}
                                      className="text-teal-500 hover:text-teal-700 disabled:opacity-40"
                                    >
                                      <Check size={11} />
                                    </button>
                                    <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600">
                                      <X size={11} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta.badgeTone}`}>{meta.label}</span>
                                    <span className="text-[10px] text-slate-400">{item.entry_date ? dayjs(item.entry_date).format("DD/MM/YYYY") : "-"}</span>
                                    <span className={`font-bold text-[10px] ${meta.textTone}`}>
                                      {meta.sign > 0 ? "+ " : "- "}{formatMoney(item.amount)} đ
                                    </span>
                                    <span className="flex-1 text-slate-600 text-[10px]">{item.note || "Điều chỉnh thủ công"}</span>
                                    <button
                                      onClick={() => { setEditId(item.id); setEditDraft({ type: item.type, note: item.note, amount: item.amount, entry_date: item.entry_date }); }}
                                      className="text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                      <Pencil size={10} />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        setSavingKey(item.id);
                                        try {
                                          await deleteAdjustment(item.id);
                                        } finally {
                                          setSavingKey(null);
                                        }
                                      }}
                                      className="text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                    {addOpen && (
                      <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-200">
                        <select
                          value={draft.type}
                          onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as PayrollAdjustmentType }))}
                          className="border border-slate-200 rounded px-1 py-0.5 text-[10px] w-32"
                        >
                          {ADJUSTMENT_OPTIONS.filter(([t]) => t !== "completed").map(([type, meta]) => (
                            <option key={type} value={type}>
                              {meta.sign > 0 ? "+ " : "- "}{meta.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={draft.entry_date || ""}
                          onChange={(e) => setDraft((prev) => ({ ...prev, entry_date: e.target.value }))}
                          className="border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none"
                        />
                        <input
                          value={draft.note}
                          onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
                          placeholder="Ghi chú..."
                          className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          value={draft.amount || ""}
                          onChange={(e) => setDraft((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-24 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none"
                          placeholder="Số tiền"
                          onKeyDown={(e) => { if (e.key === "Enter" && draft.amount > 0) void saveDraft(); }}
                        />
                        <button onClick={() => void saveDraft()} disabled={draft.amount <= 0 || savingKey === "create"} className="text-teal-500 hover:text-teal-700 disabled:opacity-40">
                          <Check size={11} />
                        </button>
                        <button onClick={() => setAddOpen(false)} className="text-slate-400">
                          <X size={11} />
                        </button>
                      </div>
                    )}
                    {adjustmentSummary.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-1 border-t border-slate-200">
                        {adjustmentSummary.map((item) => (
                          <span key={item.type} className={`text-[10px] font-semibold ${item.meta.textTone}`}>
                            {item.meta.label}: {item.meta.sign > 0 ? "+" : "-"}{formatMoney(item.amount)} đ
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={2} className="border border-slate-300 px-2 py-2 font-bold text-slate-800">Thực nhận</td>
                <td className="border border-slate-300 px-2 py-2 text-right font-bold text-red-600 text-sm">
                  {formatMoney(adjustedNet)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-sm rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            In bảng lương
          </button>
        </div>
      </div>
    </div>
  );
}

function PayrollTableLegacy({
  title, rows, summary, isLoading, period,
}: {
  title: string;
  rows: PayrollRow[];
  summary: GroupSummary;
  isLoading: boolean;
  period: string;
}) {
  const [selected, setSelected] = useState<PayrollRow | null>(null);

  return (
    <>
      {selected && (
        <PayslipModal row={selected} period={period} onClose={() => setSelected(null)} />
      )}

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-4 py-3 border-b bg-slate-50 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"Lương: "}<b>{formatMoney(summary.total_base_salary)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"Tăng ca: "}<b>{formatMoney(summary.total_overtime_salary)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-emerald-700">
              {"Thưởng: "}<b>{formatMoney(summary.total_bonus)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-700">
              {"Phạt: "}<b>{formatMoney(summary.total_punish)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
              {"Thực nhận: "}<b>{formatMoney(summary.total_net_salary)} {"đ"}</b>
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
              <th className="py-3 px-3 text-teal-600 font-semibold">Mang sang</th>
              <th className="py-3 px-3">Số buổi</th>
              <th className="py-3 px-3">Số giờ</th>
              <th className="py-3 px-3">Tăng ca (giờ)</th>
              <th className="py-3 px-3">Tiền lương</th>
              <th className="py-3 px-3">Tiền tăng ca</th>
              <th className="py-3 px-3">Thưởng</th>
              <th className="py-3 px-3">Phạt</th>
              <th className="py-3 px-3">Tạm ứng</th>
              <th className="py-3 px-3 text-sky-600">Phụ cấp (+)</th>
              <th className="py-3 px-3 text-rose-600">BHYT (-)</th>
              <th className="py-3 px-3 text-rose-600">BHXH (-)</th>
              <th className="py-3 px-3">Thực nhận</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={18}>Đang tải dữ liệu bảng lương...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={18}>Không có dữ liệu cho kỳ đã chọn.</td></tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.user_id}
                  className="border-b last:border-0 hover:bg-teal-50/60 cursor-pointer transition-colors group"
                  onClick={() => setSelected(row)}
                  title="Xem phiếu lương"
                >
                  <td className="py-3 px-3 text-slate-600">{index + 1}</td>
                  <td className="py-3 px-3 text-teal-700 font-semibold group-hover:underline">{row.full_name}</td>
                  <td className="py-3 px-3 text-slate-600">{row.phone || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.department || "-"}</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base)} đ</td>
                  <td className="py-3 px-3 text-teal-600 font-semibold">{Number(row.carry_forward || 0) !== 0 ? `${formatMoney(row.carry_forward || 0)} đ` : '—'}</td>
                  <td className="py-3 px-3 text-slate-600">{row.period_work}</td>
                  <td className="py-3 px-3 text-slate-600">{row.work_hours}</td>
                  <td className="py-3 px-3 text-slate-600">{row.overtime_hours}</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base_total)} đ</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_overtime_total)} đ</td>
                  <td className="py-3 px-3 text-emerald-600 font-semibold">{formatMoney(row.bonus_total)} đ</td>
                  <td className="py-3 px-3 text-rose-600 font-semibold">{formatMoney(row.punish_total)} đ</td>
                  <td className="py-3 px-3 text-amber-700 font-semibold">{formatMoney(row.advance_total)} đ</td>
                  <td className="py-3 px-3 text-sky-600 font-semibold">{row.allowance ? `+${formatMoney(row.allowance)}` : '—'} đ</td>
                  <td className="py-3 px-3 text-rose-500">{row.bhyt ? `-${formatMoney(row.bhyt)}` : '—'} đ</td>
                  <td className="py-3 px-3 text-rose-500">{row.bhxh ? `-${formatMoney(row.bhxh)}` : '—'} đ</td>
                  <td className="py-3 px-3 text-teal-700 font-semibold">{formatMoney(row.net_salary)} đ</td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-slate-50 font-semibold text-slate-700">
                <td className="py-3 px-3" colSpan={5}>Tổng cộng</td>
                <td className="py-3 px-3 text-teal-600">{formatMoney(summary.total_carry_forward || 0)} đ</td>
                <td className="py-3 px-3" colSpan={3}></td>
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
    </>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

function PayrollTableOld({
  title,
  rows,
  summary,
  isLoading,
  period,
}: {
  title: string;
  rows: PayrollRow[];
  summary: GroupSummary;
  isLoading: boolean;
  period: string;
}) {
  const [selected, setSelected] = useState<PayrollRow | null>(null);

  return (
    <>
      {selected && (
        <PayslipModal row={selected} period={period} onClose={() => setSelected(null)} />
      )}

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-4 py-3 border-b bg-slate-50 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"Lương: "}<b>{formatMoney(summary.total_base_salary)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"Tăng ca: "}<b>{formatMoney(summary.total_overtime_salary)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-emerald-700">
              {"Thưởng: "}<b>{formatMoney(summary.total_bonus)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-700">
              {"Phạt: "}<b>{formatMoney(summary.total_punish)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
              {"Thực nhận: "}<b>{formatMoney(summary.total_net_salary)} {"đ"}</b>
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
              <th className="py-3 px-3 text-teal-600 font-semibold">Mang sang</th>
              <th className="py-3 px-3">Số buổi</th>
              <th className="py-3 px-3">Số giờ</th>
              <th className="py-3 px-3">Tăng ca (giờ)</th>
              <th className="py-3 px-3">Tiền lương</th>
              <th className="py-3 px-3">Tiền tăng ca</th>
              <th className="py-3 px-3">Thưởng</th>
              <th className="py-3 px-3">Phạt</th>
              <th className="py-3 px-3">Tạm ứng</th>
              <th className="py-3 px-3 text-sky-600">Phụ cấp (+)</th>
              <th className="py-3 px-3 text-rose-600">BHYT (-)</th>
              <th className="py-3 px-3 text-rose-600">BHXH (-)</th>
              <th className="py-3 px-3">Thực nhận</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={18}>Đang tải dữ liệu bảng lương...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={18}>Không có dữ liệu cho kỳ đã chọn.</td></tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.user_id}
                  className="border-b last:border-0 hover:bg-teal-50/60 cursor-pointer transition-colors group"
                  onClick={() => setSelected(row)}
                  title="Xem phiếu lương"
                >
                  <td className="py-3 px-3 text-slate-600">{index + 1}</td>
                  <td className="py-3 px-3 text-teal-700 font-semibold group-hover:underline">{row.full_name}</td>
                  <td className="py-3 px-3 text-slate-600">{row.phone || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.department || "-"}</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base)} đ</td>
                  <td className="py-3 px-3 text-teal-600 font-semibold">{Number(row.carry_forward || 0) !== 0 ? `${formatMoney(row.carry_forward || 0)} đ` : "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.period_work}</td>
                  <td className="py-3 px-3 text-slate-600">{row.work_hours}</td>
                  <td className="py-3 px-3 text-slate-600">{row.overtime_hours}</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base_total)} đ</td>
                  <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_overtime_total)} đ</td>
                  <td className="py-3 px-3 text-emerald-600 font-semibold">{formatMoney(row.bonus_total)} đ</td>
                  <td className="py-3 px-3 text-rose-600 font-semibold">{formatMoney(row.punish_total)} đ</td>
                  <td className="py-3 px-3 text-amber-700 font-semibold">{formatMoney(row.advance_total)} đ</td>
                  <td className="py-3 px-3 text-sky-600 font-semibold">{row.allowance ? `+${formatMoney(row.allowance)} đ` : "-"}</td>
                  <td className="py-3 px-3 text-rose-500">{row.bhyt ? `-${formatMoney(row.bhyt)} đ` : "-"}</td>
                  <td className="py-3 px-3 text-rose-500">{row.bhxh ? `-${formatMoney(row.bhxh)} đ` : "-"}</td>
                  <td className="py-3 px-3 text-teal-700 font-semibold">{formatMoney(row.net_salary)} đ</td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-slate-50 font-semibold text-slate-700">
                <td className="py-3 px-3" colSpan={5}>Tổng cộng</td>
                <td className="py-3 px-3 text-teal-600">{formatMoney(summary.total_carry_forward || 0)} đ</td>
                <td className="py-3 px-3" colSpan={3}></td>
                <td className="py-3 px-3">{formatMoney(summary.total_base_salary)} đ</td>
                <td className="py-3 px-3">{formatMoney(summary.total_overtime_salary)} đ</td>
                <td className="py-3 px-3 text-emerald-700">{formatMoney(summary.total_bonus)} đ</td>
                <td className="py-3 px-3 text-rose-700">{formatMoney(summary.total_punish)} đ</td>
                <td className="py-3 px-3 text-amber-700">{formatMoney(summary.total_advance)} đ</td>
                <td className="py-3 px-3 text-sky-700">{formatMoney(summary.total_allowance || 0)} đ</td>
                <td className="py-3 px-3 text-rose-600">-{formatMoney(summary.total_bhyt || 0)} đ</td>
                <td className="py-3 px-3 text-rose-600">-{formatMoney(summary.total_bhxh || 0)} đ</td>
                <td className="py-3 px-3 text-teal-700">{formatMoney(summary.total_net_salary)} đ</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}

const isPayrollExpandableType = (
  value: PayrollAdjustmentType | undefined,
): value is PayrollExpandableAdjustmentType =>
  value === "bonus" || value === "punish" || value === "advance" || value === "carry_forward";

type PayrollExpandableRow = BonusPunishRow & { type: PayrollExpandableAdjustmentType };
type PayrollExpandableDraft = Omit<BonusPunishRow, "id" | "type"> & { type: PayrollExpandableAdjustmentType };

const PAYROLL_EXPANDABLE_TONES: Record<
  PayrollExpandableAdjustmentType,
  { edit: string; view: string; action: string; saveButton: string }
> = {
  bonus: {
    edit: "bg-emerald-50 border-emerald-300",
    view: "bg-emerald-50 border-emerald-200 text-emerald-800",
    action: "text-emerald-500 hover:text-emerald-700",
    saveButton: "bg-emerald-500 hover:bg-emerald-600",
  },
  punish: {
    edit: "bg-rose-50 border-rose-300",
    view: "bg-rose-50 border-rose-200 text-rose-800",
    action: "text-rose-500 hover:text-rose-700",
    saveButton: "bg-rose-500 hover:bg-rose-600",
  },
  advance: {
    edit: "bg-amber-50 border-amber-300",
    view: "bg-amber-50 border-amber-200 text-amber-800",
    action: "text-amber-500 hover:text-amber-700",
    saveButton: "bg-amber-500 hover:bg-amber-600",
  },
  carry_forward: {
    edit: "bg-teal-50 border-teal-300",
    view: "bg-teal-50 border-teal-200 text-teal-850",
    action: "text-teal-500 hover:text-teal-700",
    saveButton: "bg-teal-500 hover:bg-teal-600",
  },
};

const getPayrollExpandableDraft = (row?: Partial<BonusPunishRow>): PayrollExpandableDraft => ({
  type: isPayrollExpandableType(row?.type) ? row.type : "bonus",
  note: typeof row?.note === "string" ? row.note : "",
  amount: Number(row?.amount || 0),
  entry_date: typeof row?.entry_date === "string" ? row.entry_date : dayjs().format("YYYY-MM-DD"),
});

function PayrollAdjustmentRow({
  item,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  item: PayrollExpandableRow;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: PayrollExpandableDraft) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<PayrollExpandableDraft>(() => getPayrollExpandableDraft(item));

  useEffect(() => {
    if (isEditing) setDraft(getPayrollExpandableDraft(item));
  }, [item, isEditing]);

  const meta = ADJUSTMENT_META[item.type];
  const tone = PAYROLL_EXPANDABLE_TONES[draft.type];

  const saveDraft = () => {
    if (draft.amount <= 0) {
      notification.warning({ message: "So tien phai > 0" });
      return;
    }
    onSave(draft);
  };

  if (isEditing) {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-xs px-3 py-2 rounded-lg border ${tone.edit}`}>
        <select
          value={draft.type}
          onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as PayrollExpandableAdjustmentType }))}
          className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
        >
          {PAYROLL_EXPANDABLE_OPTIONS.map(([type, optionMeta]) => (
            <option key={type} value={type}>
              {optionMeta.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={draft.entry_date || ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, entry_date: e.target.value }))}
          className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
        />

        <input
          type="number"
          min="0"
          value={draft.amount || ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, amount: Number(e.target.value) }))}
          className="w-32 text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
          placeholder="So tien..."
        />

        <input
          autoFocus
          value={draft.note}
          onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveDraft();
            if (e.key === "Escape") onCancelEdit();
          }}
          placeholder="Ghi chu..."
          className="flex-1 min-w-[160px] text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
        />

        <button onClick={saveDraft} className={tone.action} title="Luu">
          <Check size={13} />
        </button>
        <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600" title="Huy">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg border group/row ${PAYROLL_EXPANDABLE_TONES[item.type].view}`}>
      <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${meta.badgeTone}`}>{meta.label}</span>
      <span className="whitespace-nowrap text-slate-500">{item.entry_date ? dayjs(item.entry_date).format("DD/MM/YYYY") : "-"}</span>
      <span className={`font-semibold whitespace-nowrap ${meta.textTone}`}>
        {meta.sign > 0 ? "+ " : "- "}
        {formatMoney(item.amount)} đ
      </span>
      <span className="flex-1 text-slate-500 italic truncate">{item.note || "Dieu chinh thu cong"}</span>

      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity ml-auto">
        <button onClick={onStartEdit} title="Sua" className={`p-1 rounded hover:bg-white transition-colors ${PAYROLL_EXPANDABLE_TONES[item.type].action}`}>
          <Pencil size={11} />
        </button>
        <button onClick={onDelete} title="Xoa" className="p-1 rounded hover:bg-white text-rose-400 hover:text-rose-600 transition-colors">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function PayrollAdjustmentSubRowOld({
  store,
}: {
  store: BonusPunishStore;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<PayrollExpandableDraft>(() => getPayrollExpandableDraft());

  const rows = useMemo(
    () => store.rows.filter((item): item is PayrollExpandableRow => isPayrollExpandableType(item.type)),
    [store.rows],
  );

  const addTone = PAYROLL_EXPANDABLE_TONES[addForm.type];

  const handleAdd = () => {
    if (addForm.amount <= 0) {
      notification.warning({ message: "So tien phai > 0" });
      return;
    }
    store.add(addForm);
    setAddForm(getPayrollExpandableDraft());
    setEditingId(null);
  };

  return (
    <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-1.5">
        {rows.length === 0 && (
            <span className="text-xs text-slate-400 italic">Chưa có thưởng, phạt hoặc tạm ứng.</span>
        )}

        {rows.map((item) => (
          <PayrollAdjustmentRow
            key={item.id}
            item={item}
            isEditing={editingId === item.id}
            onStartEdit={() => setEditingId(item.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={(draft) => {
              store.update(item.id, draft);
              setEditingId(null);
            }}
            onDelete={() => {
              store.remove(item.id);
              setEditingId((current) => (current === item.id ? null : current));
            }}
          />
        ))}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <select
            value={addForm.type}
            onChange={(e) => setAddForm((prev) => ({ ...prev, type: e.target.value as PayrollExpandableAdjustmentType }))}
            className={`text-xs border rounded-md px-2 py-1 cursor-pointer ${addTone.edit}`}
          >
            {PAYROLL_EXPANDABLE_OPTIONS.map(([type, meta]) => (
              <option key={type} value={type}>
                {meta.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={addForm.entry_date || ""}
            onChange={(e) => setAddForm((prev) => ({ ...prev, entry_date: e.target.value }))}
            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
          />

          <input
            type="number"
            min="0"
            value={addForm.amount || ""}
            onChange={(e) => setAddForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
            className="w-36 text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
            placeholder="So tien..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />

          <input
            value={addForm.note}
            onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Ghi chu..."
            className="text-xs border border-slate-200 rounded-md px-2 py-1 flex-1 min-w-[160px] bg-white"
          />

          <button
            type="button"
            onClick={handleAdd}
            className={`text-xs text-white px-3 py-1 rounded-md transition-colors whitespace-nowrap ${addTone.saveButton}`}
          >
            + Luu
          </button>
        </div>
      </div>
    </div>
  );
}

function PayrollTableRowOld({
  row,
  index,
  period,
  isExpanded,
  onToggleExpand,
  onSelect,
}: {
  row: PayrollRow;
  index: number;
  period: string;
  isExpanded: boolean;
  onToggleExpand: (userId: string) => void;
  onSelect: (row: PayrollRow) => void;
}) {
  const store = useBonusPunishLegacy(row.user_id, period);
  const values = useMemo(() => getPayrollTableComputedValues(row, store.rows), [row, store.rows]);

  return (
    <React.Fragment>
      <tr
        className="border-b last:border-0 hover:bg-teal-50/60 cursor-pointer transition-colors group"
        onClick={() => onSelect(row)}
        title="Xem phieu luong"
      >
        <td className="py-3 px-3 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(row.user_id);
            }}
            className="text-slate-400 hover:text-teal-600 transition-colors"
            title="Mở chi tiết thưởng / phạt / tạm ứng"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="py-3 px-3 text-slate-600">{index + 1}</td>
        <td className="py-3 px-3 text-teal-700 font-semibold group-hover:underline">{row.full_name}</td>
        <td className="py-3 px-3 text-slate-600">{row.phone || "-"}</td>
        <td className="py-3 px-3 text-slate-600">{row.department || "-"}</td>
        <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base)} đ</td>
        <td className="py-3 px-3 text-teal-600 font-semibold">{values.carryForwardAmount !== 0 ? `${formatMoney(values.carryForwardAmount)} đ` : "-"}</td>
        <td className="py-3 px-3 text-slate-600">{row.period_work}</td>
        <td className="py-3 px-3 text-slate-600">{row.work_hours}</td>
        <td className="py-3 px-3 text-slate-600">{row.overtime_hours}</td>
        <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base_total)} đ</td>
        <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_overtime_total)} đ</td>
        <td className="py-3 px-3 text-emerald-600 font-semibold">{formatMoney(values.bonusAmount)} đ</td>
        <td className="py-3 px-3 text-rose-600 font-semibold">{formatMoney(values.punishAmount)} đ</td>
        <td className="py-3 px-3 text-amber-700 font-semibold">{formatMoney(values.advanceAmount)} đ</td>
        <td className="py-3 px-3 text-sky-600 font-semibold">{values.allowanceAmount > 0 ? `+${formatMoney(values.allowanceAmount)} đ` : "-"}</td>
        <td className="py-3 px-3 text-rose-500">{values.bhytAmount > 0 ? `-${formatMoney(values.bhytAmount)} đ` : "-"}</td>
        <td className="py-3 px-3 text-rose-500">{values.bhxhAmount > 0 ? `-${formatMoney(values.bhxhAmount)} đ` : "-"}</td>
        <td className="py-3 px-3 text-teal-700 font-semibold">{formatMoney(values.adjustedNet)} đ</td>
      </tr>

      {isExpanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={19} className="p-0">
            <PayrollAdjustmentSubRowOld store={store} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

function PayrollTableLocalOld({
  title,
  rows,
  summary,
  isLoading,
  period,
}: {
  title: string;
  rows: PayrollRow[];
  summary: GroupSummary;
  isLoading: boolean;
  period: string;
}) {
  const [selected, setSelected] = useState<PayrollRow | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adjustmentVersion, setAdjustmentVersion] = useState(0);

  useEffect(() => {
    setExpanded(new Set());
  }, [period, rows]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleAdjustmentsChanged = () => setAdjustmentVersion((current) => current + 1);
    window.addEventListener(PAYROLL_ADJUSTMENT_EVENT, handleAdjustmentsChanged as EventListener);
    return () => window.removeEventListener(PAYROLL_ADJUSTMENT_EVENT, handleAdjustmentsChanged as EventListener);
  }, []);

  const adjustedSummary = useMemo(
    () => getAdjustedGroupSummary(summary, rows, period),
    [summary, rows, period, adjustmentVersion],
  );

  const toggleExpand = (userId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <>
      {selected && (
        <PayslipModal row={selected} period={period} onClose={() => setSelected(null)} />
      )}

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-4 py-3 border-b bg-slate-50 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"LÆ°Æ¡ng: "}<b>{formatMoney(adjustedSummary.total_base_salary)} {"Ä‘"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"TÄƒng ca: "}<b>{formatMoney(adjustedSummary.total_overtime_salary)} {"Ä‘"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-emerald-700">
              {"ThÆ°á»Ÿng: "}<b>{formatMoney(adjustedSummary.total_bonus)} {"Ä‘"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-700">
              {"Pháº¡t: "}<b>{formatMoney(adjustedSummary.total_punish)} {"Ä‘"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
              {"Thá»±c nháº­n: "}<b>{formatMoney(adjustedSummary.total_net_salary)} {"Ä‘"}</b>
            </span>
          </div>
        </div>

        <table className="w-full text-sm text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="text-slate-500 text-xs border-b bg-slate-50">
              <th className="py-3 px-3 w-10"></th>
              <th className="py-3 px-3">STT</th>
              <th className="py-3 px-3">Há»  tÃªn</th>
              <th className="py-3 px-3">SÄ T</th>
              <th className="py-3 px-3">Bá»™ pháº­n</th>
              <th className="py-3 px-3">LÆ°Æ¡ng cÆ¡ báº£n</th>
              <th className="py-3 px-3 text-teal-600 font-semibold">Mang sang</th>
              <th className="py-3 px-3">Sá»‘ buá»•i</th>
              <th className="py-3 px-3">Sá»‘ giá» </th>
              <th className="py-3 px-3">TÄƒng ca (giá» )</th>
              <th className="py-3 px-3">Tiá» n lÆ°Æ¡ng</th>
              <th className="py-3 px-3">Tiá» n tÄƒng ca</th>
              <th className="py-3 px-3">ThÆ°á»Ÿng</th>
              <th className="py-3 px-3">Pháº¡t</th>
              <th className="py-3 px-3">Táº¡m á»©ng</th>
              <th className="py-3 px-3 text-sky-600">Phá»¥ cáº¥p (+)</th>
              <th className="py-3 px-3 text-rose-600">BHYT (-)</th>
              <th className="py-3 px-3 text-rose-600">BHXH (-)</th>
              <th className="py-3 px-3">Thực nhận</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={19}>Ä ang táº£i dá»¯ liá»‡u báº£ng lÆ°Æ¡ng...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={19}>KhÃ´ng cÃ³ dá»¯ liá»‡u cho ká»³ Ä‘Ã£ chá» n.</td></tr>
            ) : (
              rows.map((row, index) => (
                <PayrollTableRowOld
                  key={row.user_id}
                  row={row}
                  index={index}
                  period={period}
                  isExpanded={expanded.has(row.user_id)}
                  onToggleExpand={toggleExpand}
                  onSelect={setSelected}
                />
              ))
            )}
          </tbody>
          {!isLoading && rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-slate-50 font-semibold text-slate-700">
                <td className="py-3 px-3" colSpan={6}>Tá»•ng cá»™ng</td>
                <td className="py-3 px-3 text-teal-600">{formatMoney(adjustedSummary.total_carry_forward || 0)} đ</td>
                <td className="py-3 px-3" colSpan={3}></td>
                <td className="py-3 px-3">{formatMoney(adjustedSummary.total_base_salary)} Ä‘</td>
                <td className="py-3 px-3">{formatMoney(adjustedSummary.total_overtime_salary)} Ä‘</td>
                <td className="py-3 px-3 text-emerald-700">{formatMoney(adjustedSummary.total_bonus)} Ä‘</td>
                <td className="py-3 px-3 text-rose-700">{formatMoney(adjustedSummary.total_punish)} Ä‘</td>
                <td className="py-3 px-3 text-amber-700">{formatMoney(adjustedSummary.total_advance)} Ä‘</td>
                <td className="py-3 px-3 text-sky-700">{formatMoney(adjustedSummary.total_allowance || 0)} Ä‘</td>
                <td className="py-3 px-3 text-rose-600">-{formatMoney(adjustedSummary.total_bhyt || 0)} Ä‘</td>
                <td className="py-3 px-3 text-rose-600">-{formatMoney(adjustedSummary.total_bhxh || 0)} Ä‘</td>
                <td className="py-3 px-3 text-teal-700">{formatMoney(adjustedSummary.total_net_salary)} Ä‘</td>
                <td className="py-3 px-3 text-teal-600">{formatMoney(adjustedSummary.total_carry_forward || 0)} đ</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}

function PayrollAdjustmentSubRow({
  userId,
  adjustmentRows,
  onCreateAdjustment,
  onUpdateAdjustment,
  onDeleteAdjustment,
}: {
  userId: string;
  adjustmentRows: BonusPunishRow[];
  onCreateAdjustment: PayrollAdjustmentHandlers["onCreateAdjustment"];
  onUpdateAdjustment: PayrollAdjustmentHandlers["onUpdateAdjustment"];
  onDeleteAdjustment: PayrollAdjustmentHandlers["onDeleteAdjustment"];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<PayrollExpandableDraft>(() => getPayrollExpandableDraft());

  const rows = useMemo(
    () => adjustmentRows.filter((item): item is PayrollExpandableRow => isPayrollExpandableType(item.type)),
    [adjustmentRows],
  );

  const addTone = PAYROLL_EXPANDABLE_TONES[addForm.type];

  const handleAdd = async () => {
    if (addForm.amount <= 0) {
      notification.warning({ message: "So tien phai > 0" });
      return;
    }
    await onCreateAdjustment(userId, addForm);
    setAddForm(getPayrollExpandableDraft());
    setEditingId(null);
  };

  return (
    <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-1.5">
        {rows.length === 0 && (
            <span className="text-xs text-slate-400 italic">Chưa có thưởng, phạt hoặc tạm ứng.</span>
        )}

        {rows.map((item) => (
          <PayrollAdjustmentRow
            key={item.id}
            item={item}
            isEditing={editingId === item.id}
            onStartEdit={() => setEditingId(item.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={async (draft) => {
              await onUpdateAdjustment(item.id, draft);
              setEditingId(null);
            }}
            onDelete={async () => {
              await onDeleteAdjustment(item.id);
              setEditingId((current) => (current === item.id ? null : current));
            }}
          />
        ))}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <select
            value={addForm.type}
            onChange={(e) => setAddForm((prev) => ({ ...prev, type: e.target.value as PayrollExpandableAdjustmentType }))}
            className={`text-xs border rounded-md px-2 py-1 cursor-pointer ${addTone.edit}`}
          >
            {PAYROLL_EXPANDABLE_OPTIONS.map(([type, meta]) => (
              <option key={type} value={type}>
                {meta.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={addForm.entry_date || ""}
            onChange={(e) => setAddForm((prev) => ({ ...prev, entry_date: e.target.value }))}
            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
          />

          <input
            type="number"
            min="0"
            value={addForm.amount || ""}
            onChange={(e) => setAddForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
            className="w-36 text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
            placeholder="So tien..."
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAdd();
            }}
          />

          <input
            value={addForm.note}
            onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Ghi chu..."
            className="text-xs border border-slate-200 rounded-md px-2 py-1 flex-1 min-w-[160px] bg-white"
          />

          <button
            type="button"
            onClick={() => void handleAdd()}
            className={`text-xs text-white px-3 py-1 rounded-md transition-colors whitespace-nowrap ${addTone.saveButton}`}
          >
            + Luu
          </button>
        </div>
      </div>
    </div>
  );
}

function PayrollTableRow({
  row,
  index,
  adjustmentRows,
  isExpanded,
  onToggleExpand,
  onSelect,
  onCreateAdjustment,
  onUpdateAdjustment,
  onDeleteAdjustment,
}: {
  row: PayrollRow;
  index: number;
  adjustmentRows: BonusPunishRow[];
  isExpanded: boolean;
  onToggleExpand: (userId: string) => void;
  onSelect: (row: PayrollRow) => void;
  onCreateAdjustment: PayrollAdjustmentHandlers["onCreateAdjustment"];
  onUpdateAdjustment: PayrollAdjustmentHandlers["onUpdateAdjustment"];
  onDeleteAdjustment: PayrollAdjustmentHandlers["onDeleteAdjustment"];
}) {
  return (
    <React.Fragment>
      <tr
        className="border-b last:border-0 hover:bg-teal-50/60 cursor-pointer transition-colors group"
        onClick={() => onSelect(row)}
        title="Xem phieu luong"
      >
        <td className="py-3 px-3 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(row.user_id);
            }}
            className="text-slate-400 hover:text-teal-600 transition-colors"
            title="Mở chi tiết thưởng / phạt / tạm ứng"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="py-3 px-3 text-slate-600">{index + 1}</td>
        <td className="py-3 px-3 text-teal-700 font-semibold group-hover:underline">
          <div className="flex items-center gap-1.5">
            {row.full_name}
            {row.is_completed && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800" title="Đã hoàn thành">
                ✓ Hoàn thành
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-3 text-slate-600">{row.phone || "-"}</td>
        <td className="py-3 px-3 text-slate-600">{row.department || "-"}</td>
        <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base)} đ</td>
        <td className="py-3 px-3 text-teal-600 font-semibold">{Number(row.carry_forward || 0) !== 0 ? `${formatMoney(row.carry_forward || 0)} đ` : "-"}</td>
        <td className="py-3 px-3 text-slate-600">{row.period_work}</td>
        <td className="py-3 px-3 text-slate-600">{row.work_hours}</td>
        <td className="py-3 px-3 text-slate-600">{row.overtime_hours}</td>
        <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_base_total)} đ</td>
        <td className="py-3 px-3 text-slate-700">{formatMoney(row.salary_overtime_total)} đ</td>
        <td className="py-3 px-3 text-emerald-600 font-semibold">{formatMoney(row.bonus_total)} đ</td>
        <td className="py-3 px-3 text-rose-600 font-semibold">{formatMoney(row.punish_total)} đ</td>
        <td className="py-3 px-3 text-amber-700 font-semibold">{formatMoney(row.advance_total)} đ</td>
        <td className="py-3 px-3 text-sky-600 font-semibold">{Number(row.allowance || 0) > 0 ? `+${formatMoney(row.allowance || 0)} đ` : "-"}</td>
        <td className="py-3 px-3 text-rose-500">{Number(row.bhyt || 0) > 0 ? `-${formatMoney(row.bhyt || 0)} đ` : "-"}</td>
        <td className="py-3 px-3 text-rose-500">{Number(row.bhxh || 0) > 0 ? `-${formatMoney(row.bhxh || 0)} đ` : "-"}</td>
        <td className="py-3 px-3 text-teal-700 font-semibold">{formatMoney(row.net_salary)} đ</td>
      </tr>

      {isExpanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={19} className="p-0">
            <PayrollAdjustmentSubRow
              userId={row.user_id}
              adjustmentRows={adjustmentRows}
              onCreateAdjustment={onCreateAdjustment}
              onUpdateAdjustment={onUpdateAdjustment}
              onDeleteAdjustment={onDeleteAdjustment}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

function PayrollTable({
  title,
  rows,
  summary,
  adjustments,
  isLoading,
  period,
  onCreateAdjustment,
  onUpdateAdjustment,
  onDeleteAdjustment,
}: {
  title: string;
  rows: PayrollRow[];
  summary: GroupSummary;
  adjustments: BonusPunishRow[];
  isLoading: boolean;
  period: string;
  onCreateAdjustment: PayrollAdjustmentHandlers["onCreateAdjustment"];
  onUpdateAdjustment: PayrollAdjustmentHandlers["onUpdateAdjustment"];
  onDeleteAdjustment: PayrollAdjustmentHandlers["onDeleteAdjustment"];
}) {
  const [selected, setSelected] = useState<PayrollRow | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpanded(new Set());
  }, [period, rows]);

  const toggleExpand = (userId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <>
      {selected && (
        <PayslipModal
          row={selected}
          period={period}
          adjustmentRows={getUserAdjustmentRows(adjustments, selected.user_id)}
          onCreateAdjustment={onCreateAdjustment}
          onUpdateAdjustment={onUpdateAdjustment}
          onDeleteAdjustment={onDeleteAdjustment}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-4 py-3 border-b bg-slate-50 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"Lương: "}<b>{formatMoney(summary.total_base_salary)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
              {"Tăng ca: "}<b>{formatMoney(summary.total_overtime_salary)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-emerald-700">
              {"Thưởng: "}<b>{formatMoney(summary.total_bonus)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-700">
              {"Phạt: "}<b>{formatMoney(summary.total_punish)} {"đ"}</b>
            </span>
            <span className="px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
              {"Thực nhận: "}<b>{formatMoney(summary.total_net_salary)} {"đ"}</b>
            </span>
          </div>
        </div>

        <table className="w-full text-sm text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="text-slate-500 text-xs border-b bg-slate-50">
              <th className="py-3 px-3 w-10"></th>
              <th className="py-3 px-3">STT</th>
              <th className="py-3 px-3">Họ tên</th>
              <th className="py-3 px-3">SĐT</th>
              <th className="py-3 px-3">Bộ phận</th>
              <th className="py-3 px-3">Lương cơ bản</th>
              <th className="py-3 px-3 text-teal-600 font-semibold">Mang sang</th>
              <th className="py-3 px-3">Số buổi</th>
              <th className="py-3 px-3">Số giờ</th>
              <th className="py-3 px-3">Tăng ca (giờ)</th>
              <th className="py-3 px-3">Tiền lương</th>
              <th className="py-3 px-3">Tiền tăng ca</th>
              <th className="py-3 px-3">Thưởng</th>
              <th className="py-3 px-3">Phạt</th>
              <th className="py-3 px-3">Tạm ứng</th>
              <th className="py-3 px-3 text-sky-600">Phụ cấp (+)</th>
              <th className="py-3 px-3 text-rose-600">BHYT (-)</th>
              <th className="py-3 px-3 text-rose-600">BHXH (-)</th>
              <th className="py-3 px-3">Thực nhận</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={19}>Đang tải dữ liệu bảng lương...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="py-8 px-3 text-center text-slate-500" colSpan={19}>Không có dữ liệu cho kỳ đã chọn.</td></tr>
            ) : (
              rows.map((row, index) => (
                <PayrollTableRow
                  key={row.user_id}
                  row={row}
                  index={index}
                  adjustmentRows={getUserAdjustmentRows(adjustments, row.user_id)}
                  isExpanded={expanded.has(row.user_id)}
                  onToggleExpand={toggleExpand}
                  onSelect={setSelected}
                  onCreateAdjustment={onCreateAdjustment}
                  onUpdateAdjustment={onUpdateAdjustment}
                  onDeleteAdjustment={onDeleteAdjustment}
                />
              ))
            )}
          </tbody>
          {!isLoading && rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-slate-50 font-semibold text-slate-700">
                <td className="py-3 px-3" colSpan={6}>Tổng cộng</td>
                <td className="py-3 px-3 text-teal-600">{formatMoney(summary.total_carry_forward || 0)} đ</td>
                <td className="py-3 px-3" colSpan={3}></td>
                <td className="py-3 px-3">{formatMoney(summary.total_base_salary)} đ</td>
                <td className="py-3 px-3">{formatMoney(summary.total_overtime_salary)} đ</td>
                <td className="py-3 px-3 text-emerald-700">{formatMoney(summary.total_bonus)} đ</td>
                <td className="py-3 px-3 text-rose-700">{formatMoney(summary.total_punish)} đ</td>
                <td className="py-3 px-3 text-amber-700">{formatMoney(summary.total_advance)} đ</td>
                <td className="py-3 px-3 text-sky-700">{formatMoney(summary.total_allowance || 0)} đ</td>
                <td className="py-3 px-3 text-rose-600">-{formatMoney(summary.total_bhyt || 0)} đ</td>
                <td className="py-3 px-3 text-rose-600">-{formatMoney(summary.total_bhxh || 0)} đ</td>
                <td className="py-3 px-3 text-teal-700">{formatMoney(summary.total_net_salary)} đ</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}

export default function PayrollSummaryTab() {
  const { userLeadId } = useUser();
  const [filterMode, setFilterMode] = useState<FilterMode>("single");
  const [month, setMonth] = useState(thisMonth);
  const [fromMonth, setFromMonth] = useState(thisMonth);
  const [toMonth, setToMonth] = useState(thisMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [adjustments, setAdjustments] = useState<BonusPunishRow[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>(emptySummary);
  const [staffRows, setStaffRows] = useState<PayrollRow[]>([]);
  const [supplierRows, setSupplierRows] = useState<PayrollRow[]>([]);
  const [staffSummary, setStaffSummary] = useState<GroupSummary>(emptyGroupSummary);
  const [supplierSummary, setSupplierSummary] = useState<GroupSummary>(emptyGroupSummary);

  // Period dùng để hiển thị trong payslip
  const activePeriod = filterMode === "single" ? month : fromMonth;

  const durationLabel = useMemo(() => {
    if (!summary.from_month || !summary.to_month) return "Không xác định";
    if (summary.from_month === summary.to_month)
      return dayjs(`${summary.from_month}-01`).format("MM/YYYY");
    return `${dayjs(`${summary.from_month}-01`).format("MM/YYYY")} - ${dayjs(`${summary.to_month}-01`).format("MM/YYYY")}`;
  }, [summary.from_month, summary.to_month]);

  const fetchPayrollSummary = async () => {
    if (!userLeadId) return;
    if (filterMode === "range" && fromMonth > toMonth) {
      notification.warning({ message: "Tháng bắt đầu phải nhỏ hơn hoặc bằng tháng kết thúc" });
      return;
    }
    setIsLoading(true);
    try {
      const params: Record<string, string> = { lead: String(userLeadId) };
      if (filterMode === "single") params.month = month;
      else { params.from_month = fromMonth; params.to_month = toMonth; }

      const response = await AccountingService.getPayrollSummary(params);
      const data: PayrollSummaryResponse = response.data || {};

      const fallbackRows = data.rows || [];
      const collator = new Intl.Collator("vi", { sensitivity: "base", usage: "sort", numeric: true });
      const compareByVietnameseName = (a: PayrollRow, b: PayrollRow) => {
        const aFull = normalizeNamePart(a.full_name || "");
        const bFull = normalizeNamePart(b.full_name || "");
        const byGiven = collator.compare(getVietnameseGivenName(aFull), getVietnameseGivenName(bFull));
        return byGiven !== 0 ? byGiven : collator.compare(aFull, bFull);
      };

      const nextStaffRows = [...(data.staff_rows || fallbackRows.filter((r) => r.group_type === "staff"))].sort(compareByVietnameseName);
      const nextSupplierRows = [...(data.supplier_rows || fallbackRows.filter((r) => r.group_type === "supplier"))].sort(compareByVietnameseName);

      setStaffRows(nextStaffRows);
      setSupplierRows(nextSupplierRows);
      setAdjustments(normalizeApiAdjustmentRows(data.adjustments || []));
      setSummary(data.summary || emptySummary);
      setStaffSummary({ ...buildGroupSummary(nextStaffRows), ...(data.staff_summary || {}) });
      setSupplierSummary({ ...buildGroupSummary(nextSupplierRows), ...(data.supplier_summary || {}) });
    } catch (error) {
      console.error("Failed to fetch payroll summary", error);
      notification.error({ message: "Không tải được bảng lương" });
      setAdjustments([]);
      setSummary(emptySummary);
      setStaffRows([]); setSupplierRows([]);
      setStaffSummary(emptyGroupSummary); setSupplierSummary(emptyGroupSummary);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPayrollSummary(); }, [filterMode, month, fromMonth, toMonth, userLeadId]);

  const createAdjustment = async (userId: string, draft: PayrollAdjustmentDraft) => {
    if (!userLeadId) return;
    try {
      await AccountingService.createPayrollAdjustment({
        lead_id: Number(userLeadId),
        user_id: userId,
        type: draft.type,
        amount: draft.amount,
        note: draft.note,
        entry_date: draft.entry_date || dayjs().format("YYYY-MM-DD"),
      });
      await fetchPayrollSummary();
    } catch (error) {
      console.error("Failed to create payroll adjustment", error);
      notification.error({ message: "Khong luu duoc dieu chinh luong" });
      throw error;
    }
  };

  const updateAdjustment = async (adjustmentId: string, draft: PayrollAdjustmentDraft) => {
    try {
      await AccountingService.updatePayrollAdjustment(adjustmentId, {
        type: draft.type,
        amount: draft.amount,
        note: draft.note,
        entry_date: draft.entry_date || dayjs().format("YYYY-MM-DD"),
      });
      await fetchPayrollSummary();
    } catch (error) {
      console.error("Failed to update payroll adjustment", error);
      notification.error({ message: "Khong cap nhat duoc dieu chinh luong" });
      throw error;
    }
  };

  const deleteAdjustment = async (adjustmentId: string) => {
    try {
      await AccountingService.deletePayrollAdjustment(adjustmentId);
      await fetchPayrollSummary();
    } catch (error) {
      console.error("Failed to delete payroll adjustment", error);
      notification.error({ message: "Khong xoa duoc dieu chinh luong" });
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-slate-500">
        Tổng hợp bảng lương nhân sự và thầu phụ theo kỳ. <span className="text-teal-600 font-medium">Click vào tên để xem phiếu lương cá nhân.</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Kiểu lọc</span>
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as FilterMode)} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="single">Theo tháng</option>
            <option value="range">Theo khoảng tháng</option>
          </select>
        </div>

        {filterMode === "single" ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Tháng</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-white" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Từ tháng</span>
              <input type="month" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Đến tháng</span>
              <input type="month" value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-white" />
            </div>
          </>
        )}

        <button type="button" onClick={fetchPayrollSummary} className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-teal-600 transition-colors">
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
          <div className="text-sm font-semibold text-slate-700">{summary.total_staff} / {summary.total_supplier}</div>
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

      <PayrollTable
        title="Bảng lương Nhân sự"
        rows={staffRows}
        summary={staffSummary}
        adjustments={adjustments}
        isLoading={isLoading}
        period={activePeriod}
        onCreateAdjustment={createAdjustment}
        onUpdateAdjustment={updateAdjustment}
        onDeleteAdjustment={deleteAdjustment}
      />
      <PayrollTable
        title="Bảng lương Thầu phụ"
        rows={supplierRows}
        summary={supplierSummary}
        adjustments={adjustments}
        isLoading={isLoading}
        period={activePeriod}
        onCreateAdjustment={createAdjustment}
        onUpdateAdjustment={updateAdjustment}
        onDeleteAdjustment={deleteAdjustment}
      />
    </div>
  );
}

import React from "react";

export const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

const STATUS_STYLES: Record<string, string> = {
  // Invoice / Journal statuses
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  confirmed: "bg-sky-100 text-sky-700 border-sky-200",
  partially_paid: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-slate-200 text-slate-600 border-slate-300",
  posted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  reversed: "bg-rose-100 text-rose-700 border-rose-200",
  // Fixed-asset statuses
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused: "bg-slate-100  text-slate-600   border-slate-300",
  maintenance: "bg-amber-100  text-amber-700   border-amber-200",
  repair: "bg-orange-100 text-orange-700  border-orange-200",
  pending_disposal: "bg-rose-100   text-rose-700   border-rose-200",
  disposed: "bg-slate-200  text-slate-600   border-slate-300",
};

/** Vietnamese labels for every status key */
export const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp", confirmed: "Đã xác nhận", partially_paid: "Thanh toán một phần",
  paid: "Đã thanh toán", overdue: "Quá hạn", cancelled: "Đã hủy",
  posted: "Đã ghi sổ", reversed: "Đã đảo bút toán",
  // Fixed-asset
  active: "Đang hoạt động",
  paused: "Ngưng hoạt động",
  maintenance: "Bảo trì",
  repair: "Sửa chữa",
  pending_disposal: "Đợi thanh lý",
  disposed: "Đã thanh lý",
};

/** Ordered list of fixed-asset status options */
export const FA_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active", label: "Đang hoạt động" },
  { value: "paused", label: "Ngưng hoạt động" },
  { value: "maintenance", label: "Bảo trì" },
  { value: "repair", label: "Sửa chữa" },
  { value: "pending_disposal", label: "Đợi thanh lý" },
  { value: "disposed", label: "Đã thanh lý" },
];

export function StatusBadge({ status }: { status?: string | null }) {
  const safe = status || "draft";
  const label = STATUS_LABEL[safe] || safe;
  return (
    <span className={`px-2 py-1 text-xs rounded-md border whitespace-nowrap ${STATUS_STYLES[safe] || STATUS_STYLES.draft}`}>
      {label}
    </span>
  );
}

export function SummaryCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "teal" | "emerald" | "rose" | "amber";
}) {
  const toneClass =
    tone === "teal"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-xs">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

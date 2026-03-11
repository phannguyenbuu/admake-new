import React from "react";

export const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  confirmed: "bg-sky-100 text-sky-700 border-sky-200",
  partially_paid: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-slate-200 text-slate-600 border-slate-300",
  posted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  reversed: "bg-rose-100 text-rose-700 border-rose-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const safe = status || "draft";
  return (
    <span className={`px-2 py-1 text-xs rounded-md border ${STATUS_STYLES[safe] || STATUS_STYLES.draft}`}>
      {safe}
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

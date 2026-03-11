import React from "react";
import { DOCUMENT_TYPE_GROUPS, getDocumentStatusLabel, getDocumentTypeLabel } from "./labels";

type Props = {
  month: string;
  type: string;
  status: string;
  keyword: string;
  typeOptions: string[];
  statusOptions: string[];
  onMonthChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
};

export default function DocumentFilterBar({
  month,
  type,
  status,
  keyword,
  typeOptions,
  statusOptions,
  onMonthChange,
  onTypeChange,
  onStatusChange,
  onKeywordChange,
}: Props) {
  const groupedOptions = new Set(DOCUMENT_TYPE_GROUPS.flatMap((group) => group.options));
  const standaloneOptions = typeOptions.filter((option) => !groupedOptions.has(option));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Tháng</span>
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Loại</span>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <option value="">Tất cả</option>
          {DOCUMENT_TYPE_GROUPS.map((group) => {
            const options = group.options.filter((option) => typeOptions.includes(option));
            if (options.length === 0) return null;
            return (
              <optgroup key={group.label} label={group.label}>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {getDocumentTypeLabel(option)}
                  </option>
                ))}
              </optgroup>
            );
          })}
          {standaloneOptions.map((option) => (
            <option key={option} value={option}>
              {getDocumentTypeLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Trạng thái</span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <option value="">Tất cả</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {getDocumentStatusLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <input
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder="Tìm mã chứng từ / đối tác / công trình"
        className="min-w-[280px] rounded-lg border border-slate-200 bg-white px-3 py-2"
      />
    </div>
  );
}

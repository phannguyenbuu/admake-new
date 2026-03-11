import React from "react";
import {
  CheckOutlined,
  CloseOutlined,
  EnterOutlined,
  ExclamationOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { DocumentCenterListItem } from "../../../../services/document-center.service";
import {
  DOCUMENT_STATUS_STYLES,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from "./labels";

type Props = {
  loading: boolean;
  rows: DocumentCenterListItem[];
  onOpenDetail: (row: DocumentCenterListItem) => void;
  onSubmit: (row: DocumentCenterListItem) => void;
  onApprove: (row: DocumentCenterListItem) => void;
  onCancel: (row: DocumentCenterListItem) => void;
};

const money = (amount: number) =>
  Number(amount || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

function ActionButton({
  title,
  className,
  onClick,
  children,
}: {
  title: string;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function DocumentListTable({ loading, rows, onOpenDetail, onSubmit, onApprove, onCancel }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-xs text-slate-500">
            <th className="px-3 py-3">Mã chứng từ</th>
            <th className="px-3 py-3">Loại</th>
            <th className="px-3 py-3">Ngày chứng từ</th>
            <th className="px-3 py-3">Đối tác</th>
            <th className="px-3 py-3">Công trình / Task</th>
            <th className="px-3 py-3">Giá trị</th>
            <th className="px-3 py-3">Trạng thái</th>
            <th className="px-3 py-3">Cập nhật</th>
            <th className="px-3 py-3">Tệp</th>
            <th className="px-3 py-3 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                Chưa có chứng từ phù hợp.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/70">
                <td className="px-3 py-3 font-medium text-slate-700">{row.code}</td>
                <td className="px-3 py-3 text-slate-600">{getDocumentTypeLabel(row.type)}</td>
                <td className="px-3 py-3 text-slate-600">
                  {row.docDate ? dayjs(row.docDate).format("DD/MM/YYYY") : "-"}
                </td>
                <td className="px-3 py-3 text-slate-600">{row.partnerName || "-"}</td>
                <td className="px-3 py-3 text-slate-600">{row.projectName || row.taskId || "-"}</td>
                <td className="px-3 py-3 font-semibold text-slate-700">
                  {money(row.amount)} {row.currency || "VND"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-md border px-2 py-1 text-xs ${DOCUMENT_STATUS_STYLES[row.status] || "border-slate-200 text-slate-600 bg-white"}`}
                  >
                    {getDocumentStatusLabel(row.status)}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {row.updatedAt ? dayjs(row.updatedAt).format("DD/MM/YYYY HH:mm") : "-"}
                </td>
                <td className="px-3 py-3 text-slate-600">{row.attachmentCount || 0}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton
                      title="Chi tiết"
                      className="border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      onClick={() => onOpenDetail(row)}
                    >
                      <ExclamationOutlined />
                    </ActionButton>

                    {row.status === "draft" && (
                      <ActionButton
                        title="Submit"
                        className="border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50"
                        onClick={() => onSubmit(row)}
                      >
                        <EnterOutlined />
                      </ActionButton>
                    )}

                    {row.status === "submitted" && (
                      <ActionButton
                        title="Approve"
                        className="border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                        onClick={() => onApprove(row)}
                      >
                        <CheckOutlined />
                      </ActionButton>
                    )}

                    {row.status !== "cancelled" && row.status !== "closed" && (
                      <ActionButton
                        title="Cancel"
                        className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                        onClick={() => onCancel(row)}
                      >
                        <CloseOutlined />
                      </ActionButton>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

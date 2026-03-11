import React, { useMemo, useState } from "react";
import { Modal, notification } from "antd";
import dayjs from "dayjs";
import type { DocumentCenterDetail } from "../../../../services/document-center.service";
import { DocumentCenterService } from "../../../../services/document-center.service";
import { getDocumentStatusLabel, getDocumentTypeLabel } from "./labels";

type Props = {
  open: boolean;
  loading: boolean;
  detail: DocumentCenterDetail | null;
  onClose: () => void;
  onReload: () => Promise<void>;
};

const money = (amount: number) =>
  Number(amount || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

export default function DocumentDetailModal({ open, loading, detail, onClose, onReload }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "attachments" | "links" | "audit">("info");
  const [uploading, setUploading] = useState(false);

  const tabs = useMemo(
    () => [
      { key: "info", label: "Thông tin" },
      { key: "attachments", label: "Tệp đính kèm" },
      { key: "links", label: "Liên kết" },
      { key: "audit", label: "Lịch sử" },
    ],
    []
  );

  const handleUpload = async (files: FileList | null) => {
    if (!detail?.id || !files || files.length === 0) return;
    setUploading(true);
    try {
      const ids: string[] = [];
      for (const file of Array.from(files)) {
        const res = await DocumentCenterService.uploadAttachment(file);
        if (res.data?.id) ids.push(res.data.id);
      }
      if (ids.length) {
        await DocumentCenterService.attachToDocument(detail.id, ids);
      }
      notification.success({ message: `Đã tải lên ${ids.length} tệp` });
      await onReload();
    } catch (error) {
      console.error(error);
      notification.error({ message: "Tải tệp thất bại" });
    } finally {
      setUploading(false);
    }
  };

  const detachAttachment = async (attachmentId: string) => {
    if (!detail?.id) return;
    try {
      await DocumentCenterService.detachFromDocument(detail.id, attachmentId);
      notification.success({ message: "Đã gỡ tệp khỏi chứng từ" });
      await onReload();
    } catch (error) {
      console.error(error);
      notification.error({ message: "Không thể gỡ tệp" });
    }
  };

  return (
    <Modal title="Chi tiết chứng từ" open={open} onCancel={onClose} footer={null} width={900}>
      {loading || !detail ? (
        <div className="py-8 text-center text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-700">{detail.code}</div>
            <div className="text-xs text-slate-500">
              {getDocumentTypeLabel(detail.type)} |{" "}
              {detail.docDate ? dayjs(detail.docDate).format("DD/MM/YYYY") : "-"} |{" "}
              {getDocumentStatusLabel(detail.status)}
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`border-b-2 px-3 py-2 text-sm ${
                  activeTab === tab.key ? "border-teal-500 text-teal-600" : "border-transparent text-slate-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "info" && (
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-2">Đối tác: {detail.partnerName || "-"}</div>
              <div className="rounded-lg border border-slate-200 p-2">Công trình: {detail.projectName || "-"}</div>
              <div className="rounded-lg border border-slate-200 p-2">
                Giá trị: {money(detail.amount)} {detail.currency || "VND"}
              </div>
              <div className="rounded-lg border border-slate-200 p-2">Task: {detail.taskId || "-"}</div>
              <div className="rounded-lg border border-slate-200 p-2 md:col-span-2">
                Mô tả: {detail.description || "-"}
              </div>
              <div className="rounded-lg border border-slate-200 p-2 md:col-span-2">Ghi chú: {detail.note || "-"}</div>
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input type="file" multiple onChange={(e) => handleUpload(e.target.files)} className="text-sm" />
                <span className="text-xs text-slate-500">{uploading ? "Đang tải lên..." : ""}</span>
              </div>
              <div className="flex flex-col gap-2">
                {(detail.attachments || []).length === 0 ? (
                  <div className="text-sm text-slate-500">Chưa có tệp đính kèm.</div>
                ) : (
                  (detail.attachments || []).map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                      <a
                        href={file.url || `/api/attachments/${file.id}/preview`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm text-teal-600 underline"
                      >
                        {file.filename}
                      </a>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/attachments/${file.id}/download`}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                        >
                          Tải xuống
                        </a>
                        <button
                          type="button"
                          onClick={() => detachAttachment(file.id)}
                          className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600"
                        >
                          Gỡ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "links" && (
            <div className="flex flex-col gap-2">
              {(detail.links || []).length === 0 ? (
                <div className="text-sm text-slate-500">Chưa có liên kết chứng từ.</div>
              ) : (
                (detail.links || []).map((link) => (
                  <div key={link.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                    {link.link_type || "LINK"} - {link.linked_document_id || "-"} {link.note ? `(${link.note})` : ""}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="flex flex-col gap-2">
              {(detail.auditLog || []).length === 0 ? (
                <div className="text-sm text-slate-500">Chưa có lịch sử thao tác.</div>
              ) : (
                (detail.auditLog || []).map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                    <div className="font-medium">{log.action}</div>
                    <div className="text-xs text-slate-500">
                      {getDocumentStatusLabel(log.from_status)} {"->"} {getDocumentStatusLabel(log.to_status)} |{" "}
                      {log.actedAt ? dayjs(log.actedAt).format("DD/MM/YYYY HH:mm:ss") : "-"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

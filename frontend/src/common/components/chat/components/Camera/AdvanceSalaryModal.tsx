import React, { useState } from "react";
import { Modal, notification } from "antd";
import { Coins, Upload, X, Check, Wallet, AlertCircle } from "lucide-react";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { useUser } from "../../../../common/hooks/useUser";
import type { User } from "../../../../@types/user.type";
import { TOKEN_LABEL } from "../../../../common/config";

interface AdvanceSalaryModalProps {
  open: boolean;
  onCancel: () => void;
  userEl: User | null;
}

function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
}

function buildAuthHeaders(): HeadersInit | undefined {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

const getFullUrl = (apiStatic: string, url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const separator = url.startsWith("/") ? "" : "/";
  return `${apiStatic}${separator}${url}`;
};

export default function AdvanceSalaryModal({ open, onCancel, userEl }: AdvanceSalaryModalProps) {
  const apiHost = useApiHost();
  const apiStatic = useApiStatic();
  const { notifyAdmin } = useUser();

  const [amountStr, setAmountStr] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>("");
  const [attachedFileName, setAttachedFileName] = useState<string>("");

  const parseMoneyInput = (val: string): number => {
    if (!val) return 0;
    const clean = val.trim().toLowerCase();
    if (clean.endsWith("k")) {
      const numStr = clean.slice(0, -1).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(/,/g, "");
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : Math.round(num * 1000);
    }
    if (clean.endsWith("tr") || clean.endsWith("m")) {
      const numStr = clean.replace(/tr|m/g, "").replace(/[^\d.,]/g, "").replace(/\./g, "").replace(/,/g, "");
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : Math.round(num * 1000000);
    }
    const numStr = clean.replace(/[^\d]/g, "");
    return Number(numStr) || 0;
  };

  const handleAmountChange = (val: string) => {
    if (!val) {
      setAmountStr("");
      return;
    }
    const lower = val.toLowerCase();
    if (lower.endsWith("k") || lower.endsWith("tr") || lower.endsWith("m")) {
      const parsed = parseMoneyInput(val);
      if (parsed > 0) {
        setAmountStr(parsed.toLocaleString("vi-VN"));
        return;
      }
    }
    const rawVal = val.replace(/[^\d]/g, "");
    if (rawVal === "") {
      setAmountStr("");
      return;
    }
    const formatted = Number(rawVal).toLocaleString("vi-VN");
    setAmountStr(formatted);
  };

  const handleQuickAdd = (addValue: number) => {
    const current = parseMoneyInput(amountStr);
    const updated = current + addValue;
    setAmountStr(updated.toLocaleString("vi-VN"));
  };

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "advance-salary-cash");
    formData.append("user_id", userEl?.id || "");
    formData.append("time", new Date().toISOString());

    try {
      const response = await fetch(`${apiHost}/task/new/upload`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: formData,
      });
      if (!response.ok) throw new Error("Tải ảnh thất bại");
      const data = await response.json();
      const fileUrl = data.message?.file_url || "";
      setAttachedFileUrl(fileUrl);
      setAttachedFileName(file.name);
      notification.success({ message: "Đã tải ảnh thành công!" });
    } catch (error) {
      notification.error({ message: "Lỗi tải ảnh", description: (error as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadFile(file);
    }
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseMoneyInput(amountStr);
    if (!numAmount || numAmount <= 0) {
      notification.warning({ message: "Vui lòng nhập số tiền hợp lệ!" });
      return;
    }

    if (!userEl?.id) {
      notification.error({ message: "Không xác định được thông tin nhân viên!" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: userEl.id,
        amount: numAmount,
        note: note.trim() || "Đề xuất tạm ứng lương",
        file_url: attachedFileUrl || null,
        entry_date: new Date().toISOString().slice(0, 10),
      };

      const res = await fetch(`${apiHost}/workpoint/advance-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.description || errJson.message || "Gửi đề xuất thất bại");
      }

      // Send notification to Admin
      const empName = userEl.fullName || userEl.username || "Nhân viên";
      await notifyAdmin({
        text: `Nhân viên ${empName} vừa gửi đề xuất tạm ứng ${numAmount.toLocaleString("vi-VN")}đ`,
        description: `Lý do: ${note.trim() || "Không có ghi chú"}`,
        target: "/account",
        type: "advance-request",
      });

      notification.success({
        message: "Gửi đề xuất thành công!",
        description: `Đề xuất ứng ${numAmount.toLocaleString("vi-VN")}đ đã được chuyển đến Quản lý / Kế toán duyệt.`,
      });

      // Reset
      setAmountStr("");
      setNote("");
      setAttachedFileUrl("");
      setAttachedFileName("");
      onCancel();
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi gửi đề xuất",
        description: (error as Error).message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-teal-800">
          <Wallet className="w-5 h-5 text-teal-600" />
          Đề xuất ứng tiền
        </div>
      }
      centered
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            Số tiền ứng sau khi gửi sẽ ở trạng thái <b>Chưa duyệt</b>. Quản lý / Kế toán sẽ xem xét và thông báo kết quả cho bạn.
          </div>
        </div>

        {/* Số tiền */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Số tiền muốn ứng (₫) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              placeholder="VD: 500,000 hoặc 500k"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-bold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
            />
            <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">₫</span>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {[500000, 1000000, 2000000, 5000000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAdd(val)}
                className="text-[11px] font-semibold px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer"
              >
                +{val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        {/* Lý do */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Lý do ứng tiền (ghi chú)
          </label>
          <textarea
            rows={2}
            placeholder="VD: Ứng đợt 1, gia đình có việc cần chi tiêu gấp..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>

        {/* Đính kèm ảnh */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Ảnh minh chứng / biên lai (nếu có)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              id="advance-point-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="advance-point-upload"
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-teal-400 rounded-xl bg-teal-50/50 hover:bg-teal-100/50 text-teal-800 cursor-pointer text-xs font-semibold transition-all"
            >
              {uploading ? (
                <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {attachedFileUrl ? "Đổi ảnh khác" : "Chọn ảnh từ điện thoại"}
            </label>
          </div>

          {attachedFileUrl && (
            <div className="mt-1 flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit">
              <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={getFullUrl(apiStatic, attachedFileUrl)}
                  alt="Minh chứng"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setAttachedFileUrl(""); setAttachedFileName(""); }}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{attachedFileName || "anh_minh_chung.jpg"}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ Đã đính kèm</span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            Gửi đề xuất ứng tiền
          </button>
        </div>
      </form>
    </Modal>
  );
}

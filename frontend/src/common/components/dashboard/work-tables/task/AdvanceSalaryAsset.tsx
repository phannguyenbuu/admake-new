import React, { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  CreditCard, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Upload, 
  Wallet, 
  Coins, 
  ChevronRight, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { notification, Image, Modal } from "antd";
import type { MessageTypeProps } from "../../../../@types/chat.type";
import { TOKEN_LABEL } from "../../../../common/config";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { useUser } from "../../../../common/hooks/useUser";
import DeleteConfirm from "../../../DeleteConfirm";
import bankList from "./banklist.json";

interface AdvanceSalaryAssetProps {
  title?: string;
  type?: string;
  readOnly?: boolean;
  messages?: MessageTypeProps[];
  targetUserId?: string;
  senderName?: string;
  reloadAll?: () => Promise<void>;
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

const AdvanceSalaryAsset: React.FC<AdvanceSalaryAssetProps> = ({
  title = "Ứng tiền cho nhân viên",
  type = "advance-salary-cash",
  readOnly = false,
  messages = [],
  targetUserId,
  senderName,
  reloadAll
}) => {
  const apiHost = useApiHost();
  const apiStatic = useApiStatic();
  const { userId, username, fullName } = useUser();

  // Form states
  const [amount, setAmount] = useState<string>("");
  const [transferDate, setTransferDate] = useState<string>(
    new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
  );
  const [bankAccount, setBankAccount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("Tiền mặt");
  const [customNote, setCustomNote] = useState<string>("");

  // Upload/Paste image states
  const [uploading, setUploading] = useState<boolean>(false);
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>("");
  const [attachedFileName, setAttachedFileName] = useState<string>("");

  // Parse cash advance entry safely
  const parseAdvanceText = (text?: string) => {
    if (!text) return { amountRaw: "", dateStr: "", account: "", method: "", note: "" };
    const parts = text.split("/");
    const amountRaw = (parts[0] || "").trim();
    const dateStr = (parts[1] || "").trim();
    const account = (parts[2] || "").trim();
    const method = (parts[3] || "").trim();
    const note = parts.length > 4 ? parts.slice(4).join("/").trim() : "";
    return { amountRaw, dateStr, account, method, note };
  };

  // Upload file API call
  const handleUploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("user_id", targetUserId || userId || "");
    formData.append("time", new Date().toISOString());

    try {
      const response = await fetch(`${apiHost}/task/new/upload`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: formData
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      const fileUrl = data.message?.file_url || "";
      setAttachedFileUrl(fileUrl);
      setAttachedFileName(file.name);
      notification.success({ message: "Đã tải lên minh chứng thành công!" });
    } catch (error) {
      console.error(error);
      notification.error({ message: "Lỗi tải ảnh minh chứng", description: (error as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleUploadFile(file);
    }
    event.target.value = "";
  };

  // Clipboard Paste handler
  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleUploadFile(file);
        }
        break;
      }
    }
  };

  // Submit cash advance to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount.replace(/,/g, ""));
    if (!numAmount || numAmount <= 0) {
      notification.warning({ message: "Vui lòng nhập số tiền ứng hợp lệ!" });
      return;
    }

    const formattedAmount = numAmount.toLocaleString("vi-VN");
    // Format text string compatible with backend parsing
    // Format: <amount> / <date> / <account> / <bank_or_cash> [ / <customNote>]
    const textValue = `${formattedAmount} / ${transferDate.replace("T", " ")} / ${bankAccount.trim() || "N/A"} / ${bankName}${customNote.trim() ? " / " + customNote.trim() : ""}`;

    const formData = new FormData();
    formData.append("type", type);
    formData.append("user_id", targetUserId || userId || "");
    formData.append("username", senderName || fullName || username || "");
    formData.append("text", textValue);
    if (attachedFileUrl) {
      formData.append("file_url", attachedFileUrl);
    }
    formData.append("time", new Date().toISOString());

    try {
      const response = await fetch(`${apiHost}/workpoint/message`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: formData
      });
      if (!response.ok) throw new Error("Gửi yêu cầu thất bại");
      
      notification.success({ message: "Đã thêm phiếu ứng tiền thành công!" });
      
      // Reset form
      setAmount("");
      setBankAccount("");
      setBankName("Tiền mặt");
      setCustomNote("");
      setAttachedFileUrl("");
      setAttachedFileName("");

      if (reloadAll) {
        await reloadAll();
      }
    } catch (error) {
      console.error(error);
      notification.error({ message: "Lỗi lưu phiếu ứng tiền", description: (error as Error).message });
    }
  };

  // Delete cash advance
  const handleDeleteAdvance = async (messageId: string | number | undefined) => {
    if (!messageId) return;
    try {
      const response = await fetch(`${apiHost}/message/${messageId}`, {
        method: "DELETE",
        headers: buildAuthHeaders()
      });
      if (!response.ok) throw new Error("Xóa thất bại");
      notification.success({ message: "Đã xóa phiếu ứng tiền!" });
      if (reloadAll) {
        await reloadAll();
      }
    } catch (error) {
      console.error(error);
      notification.error({ message: "Lỗi xóa phiếu ứng tiền", description: (error as Error).message });
    }
  };

  // Format currency helper
  const handleAmountChange = (val: string) => {
    const rawVal = val.replace(/[^\d]/g, "");
    if (rawVal === "") {
      setAmount("");
      return;
    }
    const formatted = Number(rawVal).toLocaleString("vi-VN");
    setAmount(formatted);
  };

  return (
    <div 
      className="w-full flex flex-col gap-6"
      onPaste={handlePaste}
    >
      {/* Creation form */}
      {!readOnly && (
        <form 
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200/80 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <div className="text-sm font-semibold text-teal-800 mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-teal-600 animate-pulse" />
            Tạo phiếu ứng tiền nhân viên
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số tiền (đ)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 500,000"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">đ</span>
              </div>
            </div>

            {/* DateTime */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày giờ chuyển</label>
              <input
                type="datetime-local"
                required
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>

            {/* Bank account number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản</label>
              <input
                type="text"
                placeholder="Số / Tên tài khoản"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>

            {/* Bank or cash method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hình thức</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              >
                <option value="Tiền mặt">💵 Tiền mặt</option>
                {bankList.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    🏦 {bank.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Second Row: Note, Upload & Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200/60 pt-4">
            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú thêm (không bắt buộc)</label>
              <input
                type="text"
                placeholder="e.g. Ứng đợt 1, mua vật tư..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>

            {/* Upload Zone */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                id="advance-image-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="advance-image-upload"
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-teal-300 rounded-xl bg-teal-50/50 hover:bg-teal-50 text-teal-700 cursor-pointer text-xs font-semibold transition-all"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Tải ảnh minh chứng
              </label>

              {/* Paste notification hint */}
              <div className="text-[10px] text-slate-400 hidden lg:block italic">
                (Hoặc bấm Ctrl+V để dán ảnh trực tiếp)
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="ml-auto flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm ứng tiền
            </button>
          </div>

          {/* Attached Image Preview */}
          {attachedFileUrl && (
            <div className="mt-3 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 w-fit">
              <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                <img 
                  src={getFullUrl(apiStatic, attachedFileUrl)} 
                  alt="Attachment Preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setAttachedFileUrl(""); setAttachedFileName(""); }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{attachedFileName || "ảnh_minh_chứng.jpg"}</span>
                <span className="text-[10px] text-slate-400">Đã đính kèm</span>
              </div>
            </div>
          )}
        </form>
      )}

      {/* History log */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Lịch sử ứng lương ({messages.length})</span>
          {messages.length > 0 && (
            <span className="text-teal-600 font-bold lowercase">
              tổng ứng: {messages.reduce((sum, msg) => {
                const { amountRaw } = parseAdvanceText(msg.text);
                const val = Number(amountRaw.replace(/[^\d]/g, ""));
                return sum + (isNaN(val) ? 0 : val);
              }, 0).toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2">
            <Wallet className="w-8 h-8 text-slate-300" />
            <span className="text-xs text-slate-400">Chưa có bản ghi ứng lương nào được lưu.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
            {messages.map((message) => {
              const { amountRaw, dateStr, account, method, note } = parseAdvanceText(message.text);
              return (
                <div 
                  key={message.message_id}
                  className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-sm hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Method icon indicator */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      method === "Tiền mặt" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {method === "Tiền mặt" ? <Wallet className="w-4.5 h-4.5" /> : <CreditCard className="w-4.5 h-4.5" />}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
                      {/* Amount */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide text-[9px]">Số tiền</span>
                        <span className="text-sm font-bold text-rose-600">-{amountRaw}đ</span>
                      </div>

                      {/* Date */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide text-[9px]">Ngày chuyển</span>
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateStr || "—"}
                        </span>
                      </div>

                      {/* Account & Method */}
                      <div className="flex flex-col col-span-1 md:col-span-2 min-w-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide text-[9px]">Chi tiết</span>
                        <div className="text-xs font-medium text-slate-600 truncate">
                          <span className="font-bold text-slate-800">{method}</span>
                          {account && account !== "N/A" && ` • TK: ${account}`}
                          {note && <span className="text-teal-600 block text-[10px] mt-0.5 font-semibold">📝 {note}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attachment & Action button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Attachment Thumbnail */}
                    {message.file_url ? (
                      <div className="relative group w-9 h-9 rounded-lg overflow-hidden border border-slate-200 cursor-pointer">
                        <Image
                          src={getFullUrl(apiStatic, message.file_url)}
                          alt="Minh chứng"
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                          preview={{
                            mask: <div className="text-[10px] font-bold">Xem</div>
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300" title="Không có minh chứng">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}

                    {/* Trash Delete button */}
                    {!readOnly && (
                      <DeleteConfirm
                        elId={message.message_id || ""}
                        onDelete={handleDeleteAdvance}
                        text="phiếu ứng tiền"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvanceSalaryAsset;

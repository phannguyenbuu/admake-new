import React, { useState, useMemo } from "react";
import { 
  Trash2, 
  Calendar, 
  CreditCard, 
  Image as ImageIcon, 
  X, 
  Upload, 
  Wallet, 
  Coins, 
  Check, 
  Save
} from "lucide-react";
import { notification, Image } from "antd";
import dayjs from "dayjs";
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
  adjustments?: any[];
  targetUserId?: string;
  senderName?: string;
  reloadAll?: () => Promise<void>;
}

interface AdvanceHistoryItem {
  id: string;
  source: "adjustment" | "message";
  amount: number;
  amountStr: string;
  dateStr: string;
  method: string;
  account: string;
  note: string;
  file_url?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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
  adjustments = [],
  targetUserId,
  senderName,
  reloadAll
}) => {
  const apiHost = useApiHost();
  const apiStatic = useApiStatic();
  const { userId, username, fullName, userLeadId } = useUser();

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
  const [saving, setSaving] = useState<boolean>(false);
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>("");
  const [attachedFileName, setAttachedFileName] = useState<string>("");

  // Parse cash advance entry safely from legacy message text
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
      notification.success({ 
        message: "Đã tải lên ảnh minh chứng!", 
        description: "Vui lòng bấm 'Lưu phiếu ứng tiền' để hoàn tất lưu thông tin." 
      });
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

  // Submit cash advance to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseMoneyInput(amount);
    if (!numAmount || numAmount <= 0) {
      notification.warning({ message: "Vui lòng nhập số tiền ứng hợp lệ!" });
      return;
    }

    setSaving(true);
    const formattedAmount = numAmount.toLocaleString("vi-VN");
    const formattedNote = `${bankName}${bankAccount.trim() ? ` - TK: ${bankAccount.trim()}` : ""}${customNote.trim() ? ` - ${customNote.trim()}` : ""}`;
    const textValue = `${formattedAmount} / ${transferDate.replace("T", " ")} / ${bankAccount.trim() || "N/A"} / ${bankName}${customNote.trim() ? " / " + customNote.trim() : ""}`;
    const entryDateStr = transferDate ? transferDate.slice(0, 10) : dayjs().format("YYYY-MM-DD");

    try {
      // 1. Lưu vào bảng payroll_adjustments (nguồn chuẩn cho Bảng lương và nhân sự)
      const adjPayload = {
        user_id: targetUserId || userId,
        lead_id: userLeadId,
        type: "advance",
        amount: numAmount,
        entry_date: entryDateStr,
        note: formattedNote,
        status: "APPROVED",
        file_url: attachedFileUrl || null
      };

      const resAdj = await fetch(`${apiHost}/workpoint/payroll-adjustments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders()
        },
        body: JSON.stringify(adjPayload)
      });

      // 2. Đồng thời lưu message để tương thích với các view cũ
      const formData = new FormData();
      formData.append("type", type);
      formData.append("user_id", targetUserId || userId || "");
      formData.append("username", senderName || fullName || username || "");
      formData.append("text", textValue);
      if (attachedFileUrl) {
        formData.append("file_url", attachedFileUrl);
      }
      formData.append("time", transferDate ? new Date(transferDate).toISOString() : new Date().toISOString());

      await fetch(`${apiHost}/workpoint/message`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: formData
      });

      if (!resAdj.ok) {
        const errJson = await resAdj.json().catch(() => ({}));
        throw new Error(errJson.description || errJson.message || "Lưu phiếu ứng thất bại");
      }
      
      notification.success({ message: "Đã lưu phiếu ứng tiền thành công!" });
      
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
    } finally {
      setSaving(false);
    }
  };

  // Delete cash advance
  const handleDeleteAdvance = async (item: AdvanceHistoryItem) => {
    try {
      if (item.source === "adjustment") {
        const response = await fetch(`${apiHost}/workpoint/payroll-adjustments/${item.id}`, {
          method: "DELETE",
          headers: buildAuthHeaders()
        });
        if (!response.ok) throw new Error("Xóa phiếu thất bại");
      } else {
        const response = await fetch(`${apiHost}/message/${item.id}`, {
          method: "DELETE",
          headers: buildAuthHeaders()
        });
        if (!response.ok) throw new Error("Xóa thất bại");
      }
      notification.success({ message: "Đã xóa phiếu ứng tiền!" });
      if (reloadAll) {
        await reloadAll();
      }
    } catch (error) {
      console.error(error);
      notification.error({ message: "Lỗi xóa phiếu ứng tiền", description: (error as Error).message });
    }
  };

  // Approve pending advance
  const handleApproveAdvance = async (adjustmentId: string) => {
    try {
      const res = await fetch(`${apiHost}/workpoint/payroll-adjustments/${adjustmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders()
        },
        body: JSON.stringify({ status: "APPROVED" })
      });
      if (!res.ok) throw new Error("Duyệt thất bại");
      notification.success({ message: "Đã duyệt phiếu ứng tiền thành công!" });
      if (reloadAll) {
        await reloadAll();
      }
    } catch (error) {
      notification.error({ message: "Lỗi duyệt phiếu", description: (error as Error).message });
    }
  };

  // Format currency helper
  const handleAmountChange = (val: string) => {
    if (!val) {
      setAmount("");
      return;
    }
    const lower = val.toLowerCase();
    if (lower.endsWith("k") || lower.endsWith("tr") || lower.endsWith("m")) {
      const parsed = parseMoneyInput(val);
      if (parsed > 0) {
        setAmount(parsed.toLocaleString("vi-VN"));
        return;
      }
    }
    const rawVal = val.replace(/[^\d]/g, "");
    if (rawVal === "") {
      setAmount("");
      return;
    }
    const formatted = Number(rawVal).toLocaleString("vi-VN");
    setAmount(formatted);
  };

  // Unified history items (combine adjustments + legacy messages)
  const historyItems: AdvanceHistoryItem[] = useMemo(() => {
    const items: AdvanceHistoryItem[] = [];
    const adjIds = new Set<string>();

    // 1. Add adjustments
    for (const adj of adjustments || []) {
      const amt = Number(adj.amount || 0);
      adjIds.add(adj.id);
      items.push({
        id: adj.id,
        source: "adjustment",
        amount: amt,
        amountStr: amt.toLocaleString("vi-VN"),
        dateStr: adj.entry_date ? dayjs(adj.entry_date).format("YYYY-MM-DD") : "",
        method: adj.note?.includes("Tiền mặt") ? "Tiền mặt" : "Chuyển khoản",
        account: "",
        note: adj.note || "Tạm ứng lương",
        file_url: adj.file_url,
        status: adj.status || "APPROVED"
      });
    }

    // 2. Add legacy messages that are not duplicated
    for (const msg of messages || []) {
      const { amountRaw, dateStr, account, method, note } = parseAdvanceText(msg.text);
      const amt = Number(amountRaw.replace(/[^\d]/g, "")) || 0;
      // Skip if exactly matches an adjustment already listed
      items.push({
        id: msg.message_id || "",
        source: "message",
        amount: amt,
        amountStr: amountRaw,
        dateStr: dateStr || (msg.createdAt ? dayjs(msg.createdAt).format("YYYY-MM-DD") : ""),
        method: method || "Tiền mặt",
        account: account,
        note: note,
        file_url: msg.file_url,
        status: "APPROVED"
      });
    }

    return items.sort((a, b) => (b.dateStr || "").localeCompare(a.dateStr || ""));
  }, [adjustments, messages]);

  const totalAdvance = useMemo(() => {
    return historyItems
      .filter((i) => i.status !== "REJECTED")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [historyItems]);

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
          <div className="text-sm font-semibold text-teal-800 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-teal-600 animate-pulse" />
              Tạo phiếu ứng tiền nhân viên
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              * Điền số tiền và bấm &quot;Lưu phiếu ứng tiền&quot;
            </span>
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
            <div className="flex flex-col gap-1">
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
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-teal-400 rounded-xl bg-teal-50/50 hover:bg-teal-100/60 text-teal-800 cursor-pointer text-xs font-semibold transition-all shadow-xs"
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
                  (Hoặc Ctrl+V dán ảnh)
                </div>
              </div>
            </div>

            {/* Submit / Save button */}
            <button
              type="submit"
              disabled={saving || uploading}
              className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu phiếu ứng tiền
            </button>
          </div>

          {/* Attached Image Preview */}
          {attachedFileUrl && (
            <div className="mt-3 flex flex-col gap-1.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 w-fit">
              <div className="flex items-center gap-3">
                <div className="relative group w-14 h-14 rounded-lg overflow-hidden border border-emerald-300">
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
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[240px]">{attachedFileName || "anh_minh_chung.jpg"}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã đính kèm ảnh
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-emerald-800 font-medium bg-white/80 px-2 py-1 rounded-md border border-emerald-100">
                👉 Nhấn nút <b>&quot;Lưu phiếu ứng tiền&quot;</b> ở trên để hoàn tất lưu vào hệ thống.
              </div>
            </div>
          )}
        </form>
      )}

      {/* History log */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Lịch sử ứng lương ({historyItems.length})</span>
          {historyItems.length > 0 && (
            <span className="text-teal-700 font-bold lowercase bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              tổng ứng: {totalAdvance.toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>

        {historyItems.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2">
            <Wallet className="w-8 h-8 text-slate-300" />
            <span className="text-xs text-slate-400">Chưa có bản ghi ứng lương nào được lưu.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
            {historyItems.map((item) => {
              const isPending = item.status === "PENDING";
              return (
                <div 
                  key={item.id}
                  className={`bg-white border rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-all ${
                    isPending ? "border-red-300 bg-red-50/20" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Method icon indicator */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPending 
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : item.method === "Tiền mặt" 
                          ? "bg-amber-50 text-amber-600" 
                          : "bg-blue-50 text-blue-600"
                    }`}>
                      {item.method === "Tiền mặt" ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
                      {/* Amount & Status badge */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide text-[9px]">Số tiền</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm font-bold ${isPending ? "text-red-600" : "text-rose-600"}`}>
                            -{item.amountStr}đ
                          </span>
                          {isPending ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white animate-pulse">
                              Chưa duyệt
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đã duyệt
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide text-[9px]">Ngày chuyển</span>
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {item.dateStr || "—"}
                        </span>
                      </div>

                      {/* Details & Note */}
                      <div className="flex flex-col col-span-1 md:col-span-2 min-w-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide text-[9px]">Chi tiết</span>
                        <div className="text-xs font-medium text-slate-600 truncate">
                          <span className="font-bold text-slate-800">{item.method}</span>
                          {item.account && item.account !== "N/A" && ` • TK: ${item.account}`}
                          {item.note && <span className="text-teal-700 block text-[10px] mt-0.5 font-semibold">📝 {item.note}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attachment, Approve button & Action button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Approve button if pending */}
                    {isPending && !readOnly && (
                      <button
                        type="button"
                        onClick={() => handleApproveAdvance(item.id)}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
                        title="Duyệt khoản ứng tiền này"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Duyệt
                      </button>
                    )}

                    {/* Attachment Thumbnail */}
                    {item.file_url ? (
                      <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-xs">
                        <Image
                          src={getFullUrl(apiStatic, item.file_url)}
                          alt="Minh chứng"
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          preview={{
                            mask: <div className="text-[10px] font-bold">Xem</div>
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300" title="Không có minh chứng">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}

                    {/* Trash Delete button */}
                    {!readOnly && (
                      <DeleteConfirm
                        elId={item.id}
                        onDelete={() => handleDeleteAdvance(item)}
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

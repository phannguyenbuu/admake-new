import React, { useState, useRef } from "react";
import { Modal, notification, Popconfirm } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Trash2, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import { useUser } from "../../../common/hooks/useUser";
import {
  AccountingErpService,
  type ApBill,
  type TaxCode,
} from "../../../services/accounting-erp.service";
import { SummaryCard } from "./shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number | undefined | null) =>
  Number(v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
const parseMoney = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;

// ─── Types ────────────────────────────────────────────────────────────────────
type Payment = { id: string; payment_date: string; amount: number; payment_method: string; payment_type: string; note?: string };
type DailyCashRef = { id: string; voucher_no: string; txn_date: string; amount: number; direction: string };
type AddPaymentForm = { amount: number; payment_type: "phat_sinh" | "tam_ung"; payment_date: string; note: string };

// ─── InlineText ───────────────────────────────────────────────────────────────
function InlineText({ value, onSave, className = "", type = "text", placeholder = "" }: { value: string | number; onSave: (v: string) => void; className?: string; type?: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value ?? ""));
  const commit = () => { setEditing(false); if (local !== String(value)) onSave(local); };
  if (editing) return <input type={type} value={local} autoFocus onChange={(e) => setLocal(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }} className={`w-full px-2 py-1 border border-teal-400 rounded-md text-sm outline-none bg-teal-50 ${className}`} placeholder={placeholder} />;
  return <span title="Nhấp để sửa" onClick={() => { setLocal(String(value ?? "")); setEditing(true); }} className={`inline-block w-full cursor-pointer rounded px-1 hover:bg-slate-100 transition-colors text-sm ${className}`}>{value !== "" && value !== null && value !== undefined ? value : <span className="text-slate-300 italic">{placeholder || "—"}</span>}</span>;
}

// ─── MoneyInput ───────────────────────────────────────────────────────────────
function MoneyInput({ value, onChange, onEnter, placeholder = "Số tiền...", className = "" }: { value: number; onChange: (n: number) => void; onEnter?: () => void; placeholder?: string; className?: string }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");
  return <input type="text" inputMode="numeric" value={focused ? raw : (value > 0 ? fmt(value) : "")} placeholder={placeholder} onFocus={() => { setFocused(true); setRaw(value > 0 ? String(value) : ""); }} onBlur={() => { setFocused(false); onChange(parseMoney(raw)); }} onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") { onChange(parseMoney(raw)); setFocused(false); onEnter?.(); } }} className={`border border-slate-200 rounded-md px-2 py-1 text-xs text-right ${className}`} />;
}

// ─── InlineVAT ────────────────────────────────────────────────────────────────
function InlineVAT({ value, taxCodes, onSave }: { value: number; taxCodes: TaxCode[]; onSave: (rate: number, taxCodeId: string | null) => void }) {
  const [editing, setEditing] = useState(false);
  const inputCodes = taxCodes.filter((t) => t.direction === "input" || t.direction === "both");
  const matched = inputCodes.find((t) => t.rate === value);
  const label = matched ? `${matched.code} (${value}%)` : `${value}%`;
  if (editing) return <select autoFocus value={matched?.id || ""} className="text-xs border border-teal-400 rounded-md px-1 py-1 outline-none bg-teal-50 w-full" onBlur={() => setEditing(false)} onChange={(e) => { setEditing(false); const c = inputCodes.find((t) => t.id === e.target.value); if (c) onSave(c.rate, c.id); }}><option value="">-- Chọn thuế --</option>{inputCodes.map((t) => <option key={t.id} value={t.id}>{t.code} – {t.name} ({t.rate}%)</option>)}</select>;
  return <span title="Nhấp để đổi mã thuế" onClick={() => setEditing(true)} className="inline-block cursor-pointer rounded px-1 hover:bg-slate-100 transition-colors text-sm w-full">{inputCodes.length > 0 ? label : <span className="text-slate-400">{value}%</span>}</span>;
}

// ─── TcDropdown (chỉ phiếu chi – direction=expense) ──────────────────────────
function TcDropdown({ value, onChange, list }: { value: string; onChange: (id: string) => void; list: DailyCashRef[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const chosen = list.find((d) => d.id === value);
  const visible = list.filter((d) => !search || d.voucher_no.toLowerCase().includes(search.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={`flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 bg-white min-w-[148px] max-w-[220px] text-left transition-colors ${chosen ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}`}>
        {chosen ? (<span className="flex items-center gap-1 truncate"><span className="font-semibold truncate text-rose-700">{chosen.voucher_no}</span><span className="font-bold text-red-600 whitespace-nowrap">{Number(chosen.amount).toLocaleString("vi-VN")}đ</span></span>) : (<span className="text-slate-400">{list.length ? "💸 Phiếu chi..." : "(chưa có phiếu)"}</span>)}
        <span className="ml-auto text-slate-300 text-[10px]">&#9662;</span>
      </button>
      {open && (
        <div className="absolute z-50 left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100"><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã phiếu..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 outline-none" /></div>
          <div className="max-h-60 overflow-y-auto">
            <div className="px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer italic" onClick={() => { onChange(""); setOpen(false); setSearch(""); }}>— Không chọn phiếu —</div>
            {visible.length === 0 && <div className="px-3 py-4 text-xs text-slate-300 text-center">Không tìm thấy</div>}
            {visible.map((d) => (
              <div key={d.id} className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${value === d.id ? "bg-rose-50" : ""}`} onClick={() => { onChange(d.id); setOpen(false); setSearch(""); }}>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap bg-rose-100 text-rose-700">⇑CP</span>
                  <span className="text-xs font-semibold text-slate-700 truncate">{d.voucher_no}</span>
                </span>
                <span className="text-xs font-bold text-red-600 whitespace-nowrap">{Number(d.amount).toLocaleString("vi-VN")} đ</span>
              </div>
            ))}
          </div>
          {chosen && <div className="border-t border-slate-100 px-3 py-1.5 flex justify-end"><button type="button" className="text-[10px] text-rose-400 hover:text-rose-600 transition-colors" onClick={() => { onChange(""); setOpen(false); }}>&#10005; Bỏ chọn</button></div>}
        </div>
      )}
    </div>
  );
}

// ─── PaymentRow ───────────────────────────────────────────────────────────────
function PaymentRow({ p, invoiceId, isEditing, onStartEdit, onCancelEdit, onDeleted, onUpdated, dailyCashList }: { p: Payment; invoiceId: string; isEditing: boolean; onStartEdit: () => void; onCancelEdit: () => void; onDeleted: () => void; onUpdated: (u: Payment) => void; dailyCashList: DailyCashRef[] }) {
  const isTamUng = p.payment_type === "tam_ung";
  const [saving, setSaving] = useState(false);
  const [dateVal, setDateVal] = useState(p.payment_date?.slice(0, 10) || dayjs().format("YYYY-MM-DD"));
  const [amtVal, setAmtVal] = useState(p.amount || 0);
  const [noteVal, setNoteVal] = useState(p.note || "");
  const [tcRefEdit, setTcRefEdit] = useState("");
  React.useEffect(() => { if (!isEditing) { setDateVal(p.payment_date?.slice(0, 10) || dayjs().format("YYYY-MM-DD")); setAmtVal(p.amount || 0); setNoteVal(p.note || ""); setTcRefEdit(""); } }, [p, isEditing]);
  const handleStartEdit = () => { const m = (p.note || "").match(/^\[TC:([^\]]+)\]\s*(.*)/); setNoteVal(m ? m[2] : (p.note || "")); setTcRefEdit(""); setDateVal(p.payment_date?.slice(0, 10) || dayjs().format("YYYY-MM-DD")); setAmtVal(p.amount || 0); onStartEdit(); };
  const saveEdit = async () => {
    if (amtVal <= 0) { notification.warning({ message: "Số tiền phải > 0" }); return; }
    setSaving(true);
    try {
      const finalNote = tcRefEdit ? `[TC:${tcRefEdit}]${noteVal ? " " + noteVal : ""}` : noteVal;
      const res = await AccountingErpService.updateApPayment(invoiceId, p.id, { payment_date: dateVal, amount: amtVal, note: finalNote });
      onUpdated({ ...p, payment_date: res.data?.payment_date || dateVal, amount: res.data?.amount ?? amtVal, note: res.data?.note ?? finalNote });
    } catch { /* noop */ }
    setSaving(false); onCancelEdit();
  };
  const handleDelete = async () => { try { await AccountingErpService.deleteApPayment(invoiceId, p.id); onDeleted(); } catch (e: any) { notification.error({ message: e?.response?.data?.description || "Xóa thất bại" }); } };

  if (isEditing) return (
    <div className={`flex flex-wrap items-center gap-2 text-xs px-3 py-2 rounded-lg border ${isTamUng ? "bg-rose-50 border-rose-300" : "bg-teal-50 border-teal-300"}`}>
      <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap shrink-0 ${isTamUng ? "bg-rose-200 text-rose-700" : "bg-teal-200 text-teal-700"}`}>{isTamUng ? "Tạm ứng" : "Phát sinh"}</span>
      <input type="date" value={dateVal} onChange={(e) => setDateVal(e.target.value)} className="border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none bg-white" disabled={saving} />
      <MoneyInput value={amtVal} onChange={setAmtVal} placeholder="Số tiền..." className="w-32" />
      <TcDropdown value={tcRefEdit} onChange={setTcRefEdit} list={dailyCashList.filter((d) => d.direction === "expense")} />
      <input autoFocus value={noteVal} onChange={(e) => setNoteVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") onCancelEdit(); }} placeholder="Ghi chú..." className="flex-1 min-w-[120px] border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none bg-white" disabled={saving} />
      <button onClick={saveEdit} disabled={saving} className={isTamUng ? "text-rose-600" : "text-teal-600"}><Check size={13} /></button>
      <button onClick={onCancelEdit} className="text-slate-400"><X size={13} /></button>
    </div>
  );

  return (
    <div className={`flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg border group/row ${isTamUng ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-teal-50 border-teal-200 text-teal-800"}`}>
      <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${isTamUng ? "bg-rose-200 text-rose-700" : "bg-teal-200 text-teal-700"}`}>{isTamUng ? "Tạm ứng" : "Phát sinh"}</span>
      <span className="whitespace-nowrap">{dayjs(p.payment_date).format("DD/MM/YYYY")}</span>
      <span className="font-semibold whitespace-nowrap">{fmt(p.amount)} đ</span>
      <span onClick={handleStartEdit} className="flex-1 text-slate-400 italic truncate max-w-[180px] cursor-pointer hover:text-slate-600" title="Nhấp để sửa">
        {(() => { const m = (p.note || "").match(/^\[TC:([^\]]+)\]\s*(.*)/); if (m) return <span className="flex items-center gap-1.5"><span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${isTamUng ? "bg-rose-200 text-rose-700" : "bg-teal-200 text-teal-700"}`}>{m[1]}</span>{m[2] && <span className="text-slate-400 italic">{m[2]}</span>}</span>; return p.note || <span className="text-slate-300 italic">Thêm ghi chú...</span>; })()}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity ml-auto">
        <button onClick={handleStartEdit} className={`p-1 rounded hover:bg-white ${isTamUng ? "text-rose-400" : "text-teal-400"}`}><Pencil size={11} /></button>
        <Popconfirm title="Xóa đợt thanh toán?" okText="Xóa" cancelText="Huỷ" okButtonProps={{ danger: true }} onConfirm={handleDelete}>
          <button className="p-1 rounded hover:bg-white text-rose-400 hover:text-rose-600"><Trash2 size={11} /></button>
        </Popconfirm>
      </div>
    </div>
  );
}

// ─── PaymentSubRow ────────────────────────────────────────────────────────────
function PaymentSubRow({ payments, invoiceId, invoiceStatus, onAddPayment, addingLoading, onPaymentsChanged, dailyCashList }: { payments: Payment[]; invoiceId: string; invoiceStatus: string; onAddPayment: (p: AddPaymentForm) => void; addingLoading: boolean; onPaymentsChanged: (u: Payment[]) => void; dailyCashList: DailyCashRef[] }) {
  const [addForm, setAddForm] = useState<AddPaymentForm>({ amount: 0, payment_type: "phat_sinh", payment_date: dayjs().format("YYYY-MM-DD"), note: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tcRef, setTcRef] = useState("");
  const canAdd = invoiceStatus !== "cancelled";
  const handleAdd = (form: AddPaymentForm) => {
    const chosen = dailyCashList.find((d) => d.id === tcRef);
    const noteWithRef = chosen ? `[TC:${chosen.voucher_no}]${form.note ? " " + form.note : ""}` : form.note;
    setEditingId(null); setTcRef("");
    onAddPayment({ ...form, note: noteWithRef });
  };
  return (
    <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100">
      <div className="flex flex-col gap-1.5">
        {payments.length === 0 && !canAdd && <span className="text-xs text-slate-400 italic">Chưa có đợt thanh toán</span>}
        {payments.map((p) => (
          <PaymentRow key={p.id} p={p} invoiceId={invoiceId} dailyCashList={dailyCashList} isEditing={editingId === p.id} onStartEdit={() => setEditingId(p.id)} onCancelEdit={() => setEditingId(null)}
            onDeleted={() => { setEditingId(null); onPaymentsChanged(payments.filter((x) => x.id !== p.id)); }}
            onUpdated={(u) => { setEditingId(null); onPaymentsChanged(payments.map((x) => (x.id === u.id ? u : x))); }}
          />
        ))}
        {canAdd && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <select value={addForm.payment_type} onChange={(e) => setAddForm((p) => ({ ...p, payment_type: e.target.value as "phat_sinh" | "tam_ung" }))} className={`text-xs border rounded-md px-2 py-1 cursor-pointer ${addForm.payment_type === "tam_ung" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-teal-300 bg-teal-50 text-teal-700"}`}>
              <option value="phat_sinh">Phát sinh</option>
              <option value="tam_ung">Tạm ứng</option>
            </select>
            <input type="date" value={addForm.payment_date} onChange={(e) => setAddForm((p) => ({ ...p, payment_date: e.target.value }))} className="text-xs border border-slate-200 rounded-md px-2 py-1" />
            <MoneyInput value={addForm.amount} onChange={(n) => setAddForm((p) => ({ ...p, amount: n }))} onEnter={() => { if (!addForm.amount || addForm.amount <= 0) { notification.warning({ message: "Vui lòng nhập số tiền > 0" }); return; } onAddPayment(addForm); setAddForm((p) => ({ ...p, amount: 0, note: "" })); }} placeholder="Số tiền..." className="w-36" />
            <input value={addForm.note} onChange={(e) => setAddForm((p) => ({ ...p, note: e.target.value }))} placeholder="Ghi chú..." className="text-xs border border-slate-200 rounded-md px-2 py-1 flex-1 min-w-[120px]" />
            <TcDropdown value={tcRef} onChange={setTcRef} list={dailyCashList.filter((d) => d.direction === "expense")} />
            <button type="button" disabled={addingLoading} onClick={() => { if (!addForm.amount || addForm.amount <= 0) { notification.warning({ message: "Vui lòng nhập số tiền > 0" }); return; } handleAdd(addForm); setAddForm((p) => ({ ...p, amount: 0, note: "" })); }} className={`text-xs text-white px-3 py-1 rounded-md transition-colors whitespace-nowrap ${addingLoading ? "opacity-40 cursor-not-allowed" : ""} ${addForm.payment_type === "tam_ung" ? "bg-rose-500 hover:bg-rose-600" : "bg-teal-500 hover:bg-teal-600"}`}>
              {addingLoading ? "Đang lưu..." : "+ Lưu"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const emptyForm = { supplier_name: "", description: "", bill_date: dayjs().format("YYYY-MM-DD"), due_date: dayjs().add(30, "day").format("YYYY-MM-DD"), base_amount: 0, tax_rate: 10, tax_code_id: "" };

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AccountsPayableTab() {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [fromDate, setFromDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [filterVat, setFilterVat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaid, setFilterPaid] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(() => Number(localStorage.getItem("ap_reminder_days") ?? 3));

  // Derive month from fromDate for daily-cash query
  const month = dayjs(fromDate).format("YYYY-MM");

  const toggleSort = (field: string) => { setPage(1); if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir("desc"); } };
  const clearSort = (field: string) => { if (sortField === field) { setSortField(null); setPage(1); } };
  const hasActiveFilter = !!(filterVat || filterStatus || filterPaid);

  const params = { lead: userLeadId, from_date: fromDate, to_date: toDate, search: keyword || undefined, page: 1, limit: 500 };

  const listQuery = useQuery({ queryKey: ["ap-list", params], enabled: !!userLeadId, queryFn: async () => (await AccountingErpService.listApBills(params)).data });
  const taxQuery = useQuery({ queryKey: ["tax-codes", userLeadId], enabled: !!userLeadId, queryFn: async () => ((await AccountingErpService.listTaxCodes({ lead: userLeadId })).data?.data || []) as TaxCode[], staleTime: 5 * 60 * 1000 });
  const taxCodes: TaxCode[] = taxQuery.data || [];

  const taskQuery = useQuery({
    queryKey: ["tasks-inlead", userLeadId], enabled: !!userLeadId, staleTime: 5 * 60 * 1000,
    queryFn: async () => { const { default: axiosClient } = await import("../../../services/axiosClient"); const data = await axiosClient.get(`/task/inlead/${userLeadId}`); return (data.data || []) as { id: string; title: string }[]; },
  });
  const tasks = taskQuery.data || [];

  const dailyCashQuery = useQuery({
    queryKey: ["daily-cash-list", userLeadId, month], enabled: !!userLeadId, staleTime: 2 * 60 * 1000,
    queryFn: async () => { const { default: axiosClient } = await import("../../../services/axiosClient"); const res = await axiosClient.get(`/accounting/daily-cash`, { params: { lead: userLeadId, from_date: dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"), to_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"), limit: 200 } }); return (res.data?.data || []) as DailyCashRef[]; },
  });
  const dailyCashList = dailyCashQuery.data || [];

  const invalidate = async () => { await queryClient.invalidateQueries({ queryKey: ["ap-list"] }); };

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => AccountingErpService.createApBill(payload),
    onSuccess: async () => { notification.success({ message: "Đã tạo công nợ phải trả" }); setOpen(false); setForm(emptyForm); await invalidate(); },
    onError: (e: any) => notification.error({ message: e?.response?.data?.description || "Lỗi tạo công nợ" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) => AccountingErpService.updateApBill(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["ap-list"] });
      const previousData = queryClient.getQueriesData({ queryKey: ["ap-list"] });
      queryClient.setQueriesData({ queryKey: ["ap-list"] }, (old: any) => { if (!old?.data) return old; return { ...old, data: old.data.map((item: ApBill) => item.id === id ? { ...item, ...payload } : item) }; });
      return { previousData };
    },
    onSuccess: () => notification.success({ message: "Đã lưu", duration: 1.5 }),
    onError: (e: any, _vars, context) => { if (context?.previousData) { context.previousData.forEach(([queryKey, data]: [any, any]) => queryClient.setQueryData(queryKey, data)); } notification.error({ message: e?.response?.data?.description || "Cập nhật thất bại" }); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["ap-list"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: ApBill) => AccountingErpService.cancelApBill(row.id),
    onSuccess: async () => { notification.success({ message: "Đã xoá công nợ" }); await invalidate(); },
    onError: (e: any) => notification.error({ message: e?.response?.data?.description || "Xoá thất bại" }),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: Record<string, any> }) => AccountingErpService.recordApPayment(invoiceId, payload),
    onSuccess: async (_res, { invoiceId }) => {
      notification.success({ message: "Đã thêm đợt thanh toán" });
      await invalidate();
      // Reload payments từ detail API để đảm bảo đúng type
      try {
        const detail = await AccountingErpService.getApBill(invoiceId);
        setPaymentsMap((prev) => ({ ...prev, [invoiceId]: (detail.data?.payments || []) as Payment[] }));
      } catch { /* ignore */ }
    },
    onError: (e: any) => notification.error({ message: e?.response?.data?.description || e?.message || "Lỗi thêm thanh toán" }),
  });

  const handleInlineUpdate = (row: ApBill, field: string, rawValue: string | number) => {
    const payload: Record<string, any> = { [field]: rawValue };
    if (field === "base_amount" || field === "tax_rate") {
      const base = field === "base_amount" ? Number(rawValue) : row.base_amount;
      const rate = field === "tax_rate" ? Number(rawValue) : row.tax_rate;
      payload.base_amount = base; payload.tax_rate = rate;
      payload.tax_amount = Math.round(base * rate / 100);
      payload.total_amount = base + payload.tax_amount;
    }
    updateMutation.mutate({ id: row.id, payload });
  };

  const handleVATChange = (row: ApBill, rate: number, taxCodeId: string | null) => {
    const base = row.base_amount;
    const taxAmt = Math.round(base * rate / 100);
    updateMutation.mutate({ id: row.id, payload: { tax_rate: rate, tax_code_id: taxCodeId, tax_amount: taxAmt, total_amount: base + taxAmt } });
  };

  const toggleExpand = async (id: string) => {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    if (!paymentsMap[id]) {
      try { const res = await AccountingErpService.getApBill(id); setPaymentsMap((prev) => ({ ...prev, [id]: (res.data?.payments || []) as Payment[] })); } catch { /* ignore */ }
    }
  };

  const allRows = (listQuery.data?.data || []) as ApBill[];
  const summary = listQuery.data?.summary || {};

  // Client-side filters
  let filteredRows = allRows;
  if (filterVat !== "") filteredRows = filteredRows.filter((r) => String(r.tax_rate ?? "") === filterVat);
  if (filterStatus) filteredRows = filteredRows.filter((r) => r.status === filterStatus);
  if (filterPaid === "unpaid") filteredRows = filteredRows.filter((r) => { const paid = (paymentsMap[r.id] || []).filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + (p.amount || 0), 0); return paid <= 0; });
  else if (filterPaid === "partial") filteredRows = filteredRows.filter((r) => { const paid = (paymentsMap[r.id] || []).filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + (p.amount || 0), 0); const total = (r.base_amount || 0) * (1 + (r.tax_rate || 0) / 100); return paid > 0 && paid < total; });
  else if (filterPaid === "paid") filteredRows = filteredRows.filter((r) => { const paid = (paymentsMap[r.id] || []).filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + (p.amount || 0), 0); const total = (r.base_amount || 0) * (1 + (r.tax_rate || 0) / 100); return paid >= total; });

  // Sort
  const sortedRows = (() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let aVal: number | string = 0, bVal: number | string = 0;
      const pmtsA = paymentsMap[a.id] || [], pmtsB = paymentsMap[b.id] || [];
      switch (sortField) {
        case "code": aVal = a.code || ""; bVal = b.code || ""; break;
        case "date": aVal = a.bill_date || ""; bVal = b.bill_date || ""; break;
        case "desc": aVal = (a.supplier_name || "").toLowerCase(); bVal = (b.supplier_name || "").toLowerCase(); break;
        case "vat": aVal = a.tax_rate ?? 0; bVal = b.tax_rate ?? 0; break;
        case "cost": { const psA = pmtsA.filter((p) => p.payment_type === "phat_sinh").reduce((s, p) => s + p.amount, 0); const psB = pmtsB.filter((p) => p.payment_type === "phat_sinh").reduce((s, p) => s + p.amount, 0); aVal = Math.round(((a.base_amount || 0) + psA) * (1 + (a.tax_rate || 0) / 100)); bVal = Math.round(((b.base_amount || 0) + psB) * (1 + (b.tax_rate || 0) / 100)); break; }
        case "paid": aVal = pmtsA.filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + p.amount, 0); bVal = pmtsB.filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + p.amount, 0); break;
        case "remaining": { const psA2 = pmtsA.filter((p) => p.payment_type === "phat_sinh").reduce((s, p) => s + p.amount, 0); const psB2 = pmtsB.filter((p) => p.payment_type === "phat_sinh").reduce((s, p) => s + p.amount, 0); const tuA = pmtsA.filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + p.amount, 0); const tuB = pmtsB.filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + p.amount, 0); aVal = Math.round(((a.base_amount || 0) + psA2) * (1 + (a.tax_rate || 0) / 100)) - tuA; bVal = Math.round(((b.base_amount || 0) + psB2) * (1 + (b.tax_rate || 0) / 100)) - tuB; break; }
        case "due": aVal = a.due_date || ""; bVal = b.due_date || ""; break;
        default: break;
      }
      if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  })();

  const totalCount = sortedRows.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const rows = pageSize === 0 ? sortedRows : sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Due-soon banner */}
      {(() => {
        const today = dayjs();
        const dueSoon = allRows.filter((r) => { if (!r.due_date || r.status === "paid" || r.status === "cancelled") return false; const diff = dayjs(r.due_date).diff(today, "day"); return diff >= 0 && diff <= reminderDays; });
        if (!dueSoon.length || reminderDays === 0) return null;
        return <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800"><span className="text-base">&#9888;&#65039;</span><span><strong>{dueSoon.length}</strong> hóa đơn phải trả sắp đến hạn trong <strong>{reminderDays} ngày</strong> tới</span><button onClick={() => setSettingsOpen(true)} className="ml-auto text-amber-500 underline text-xs hover:text-amber-700">Cài đặt nhắc</button></div>;
      })()}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Tổng phải trả" value={`${fmt(summary.total_payable || 0)} đ`} tone="teal" />
        <SummaryCard label="Đã trả" value={`${fmt(summary.paid_amount || 0)} đ`} tone="emerald" />
        <SummaryCard label="Còn phải trả" value={`${fmt(summary.outstanding_amount || 0)} đ`} tone="amber" />
        <SummaryCard label="Quá hạn" value={`${fmt(summary.overdue_amount || 0)} đ`} tone="rose" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <span className="text-xs text-slate-400 whitespace-nowrap">Từ</span>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="text-sm outline-none bg-transparent" />
            <span className="text-xs text-slate-400">&#8594;</span>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="text-sm outline-none bg-transparent" />
          </div>
          <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} placeholder="Tìm mã / nhà cung cấp..." className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <button onClick={() => setSettingsOpen(true)} title="Cài đặt" className="relative border border-slate-200 rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-50 transition-colors">
            &#9881;
            {(() => { const cnt = allRows.filter((r) => { if (!r.due_date || r.status === "paid" || r.status === "cancelled") return false; const diff = dayjs(r.due_date).diff(dayjs(), "day"); return diff >= 0 && diff <= reminderDays; }).length; return cnt > 0 ? <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{cnt}</span> : null; })()}
          </button>
          <button className="bg-rose-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-rose-600 transition-colors whitespace-nowrap" onClick={() => setOpen(true)}>+ Tạo Công nợ</button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterVat} onChange={(e) => { setFilterVat(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600">
            <option value="">VAT: Tất cả</option>
            {taxCodes.filter((t) => t.direction === "input" || t.direction === "both").map((tc) => (
              <option key={tc.id} value={String(tc.rate ?? 0)}>{tc.code} ({tc.rate ?? 0}%)</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600">
            <option value="">Trạng thái: Tất cả</option>
            {[...new Set(allRows.map((r) => r.status).filter(Boolean))].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPaid} onChange={(e) => { setFilterPaid(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600">
            <option value="">Thanh toán: Tất cả</option>
            <option value="unpaid">Chưa trả</option>
            <option value="partial">Trả một phần</option>
            <option value="paid">Đã trả đủ</option>
          </select>
          {hasActiveFilter && <button onClick={() => { setFilterVat(""); setFilterStatus(""); setFilterPaid(""); setPage(1); }} className="flex items-center gap-1 text-xs text-rose-500 border border-rose-200 rounded-lg px-2.5 py-1.5 hover:bg-rose-50 transition-colors">&#10005; Xóa bộ lọc</button>}
          <span className="ml-auto text-xs text-slate-400">{filteredRows.length !== allRows.length ? `${filteredRows.length} / ${allRows.length} mục` : `${allRows.length} mục`}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left" style={{ minWidth: 1100 }}>
          <thead>
            <tr className="text-xs text-slate-500 border-b bg-slate-50 uppercase tracking-wide">
              <th className="px-3 py-3 w-8" />
              {([
                { key: "code", label: "Mã / Ngày", cls: "" },
                { key: "desc", label: "Nhà CC", cls: "" },
                { key: "vat", label: "VAT", cls: "w-40" },
                { key: "cost", label: "Chi Phí", cls: "", style: { minWidth: 260 } },
                { key: "paid", label: "Đã Trả", cls: "w-36" },
                { key: "remaining", label: "Còn Lại", cls: "w-36" },
                { key: "due", label: "Hạn TT", cls: "w-32" },
              ] as { key: string; label: string; cls: string; style?: React.CSSProperties }[]).map(({ key, label, cls, style }) => (
                <th key={key} className={`px-3 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors ${cls}`} style={style} onClick={() => toggleSort(key)} onDoubleClick={() => clearSort(key)} title="Click để sắp xếp, double-click để tắt">
                  <span className="flex items-center gap-1 whitespace-nowrap">{label}<span className={`text-[10px] ${sortField === key ? "text-rose-500" : "text-slate-300"}`}>{sortField === key ? (sortDir === "asc" ? "▲" : "▼") : "▲▼"}</span></span>
                </th>
              ))}
              <th className="px-3 py-3 text-center w-12">Xoá</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expanded.has(row.id);
              const pmts = paymentsMap[row.id] || [];
              const psAmt = paymentsMap[row.id] ? pmts.filter((p) => p.payment_type === "phat_sinh").reduce((s, p) => s + p.amount, 0) : (row.phat_sinh_amount || 0);
              const tuAmt = paymentsMap[row.id] ? pmts.filter((p) => p.payment_type === "tam_ung").reduce((s, p) => s + p.amount, 0) : (row.tam_ung_amount || 0);
              const base = row.base_amount || 0;
              const vatRate = (row.tax_rate || 0) / 100;
              const totalCost = Math.round((base + psAmt) * (1 + vatRate));
              const paid = tuAmt;
              const remaining = totalCost - paid;
              const isDueSoon = row.due_date && row.status !== "paid" && row.status !== "cancelled" && dayjs(row.due_date).diff(dayjs(), "day") >= 0 && dayjs(row.due_date).diff(dayjs(), "day") <= reminderDays;
              return (
                <React.Fragment key={row.id}>
                  <tr className={`border-b last:border-0 hover:bg-slate-50/60 group transition-colors ${isDueSoon ? "bg-amber-50/40" : ""}`}>
                    <td className="px-3 py-3 text-center"><button onClick={() => toggleExpand(row.id)} className="text-slate-400 hover:text-rose-600 transition-colors">{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button></td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-700 text-xs leading-tight">{row.code}</div>
                      <InlineText type="date" value={row.bill_date || ""} onSave={(v) => handleInlineUpdate(row, "bill_date", v)} className="text-[11px] text-slate-400" />
                    </td>
                    <td className="px-3 py-2 min-w-[180px]">
                      <InlineText value={row.supplier_name || ""} placeholder="Nhà cung cấp" onSave={(v) => handleInlineUpdate(row, "supplier_name", v)} />
                      <select title="Gắn công việc" value={tasks.find((t) => t.title === row.description)?.id || ""} onChange={(e) => { const t = tasks.find((x) => x.id === e.target.value); handleInlineUpdate(row, "description", t ? t.title : ""); }} className="mt-0.5 w-full text-[11px] text-slate-600 border border-slate-200 rounded px-1 py-0.5 bg-white hover:border-rose-400 cursor-pointer"><option value="">{tasks.length ? "-- Chọn công việc --" : "(Chưa có task)"}</option>{tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
                    </td>
                    <td className="px-3 py-2"><InlineVAT value={row.tax_rate ?? 0} taxCodes={taxCodes} onSave={(rate, taxCodeId) => handleVATChange(row, rate, taxCodeId)} /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 text-xs flex-wrap">
                        <InlineText type="text" value={fmt(row.base_amount || 0)} placeholder="0" onSave={(v) => handleInlineUpdate(row, "base_amount", parseMoney(v))} className="w-28 text-left" />
                        {psAmt > 0 && <span className="text-teal-600 font-medium">+{fmt(psAmt)}</span>}
                        <span className="text-slate-400">×(1+{row.tax_rate || 0}%)</span>
                        <span className="font-semibold text-rose-700">= {fmt(totalCost)} đ</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-emerald-700 font-medium text-sm">{fmt(paid)} đ</td>
                    <td className="px-3 py-2 text-amber-700 font-medium text-sm">{fmt(remaining)} đ</td>
                    <td className="px-3 py-2"><InlineText type="date" value={row.due_date || ""} placeholder="Chưa đặt" onSave={(v) => handleInlineUpdate(row, "due_date", v)} className="text-xs" /></td>
                    <td className="px-3 py-2 text-center">
                      <Popconfirm title="Xoá công nợ này?" description="Hành động không thể hoàn tác." okText="Xoá" cancelText="Huỷ" okButtonProps={{ danger: true }} onConfirm={() => deleteMutation.mutate(row)}>
                        <button className="p-1.5 rounded-md border border-rose-200 text-rose-500 hover:text-rose-700 hover:border-rose-400 hover:bg-rose-50 transition-colors"><Trash2 size={13} /></button>
                      </Popconfirm>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={9} className="p-0">
                        <PaymentSubRow payments={pmts} invoiceId={row.id} invoiceStatus={row.status} addingLoading={paymentMutation.isPending} dailyCashList={dailyCashList}
                          onPaymentsChanged={(updated) => setPaymentsMap((prev) => ({ ...prev, [row.id]: updated }))}
                          onAddPayment={(p) => paymentMutation.mutate({ invoiceId: row.id, payload: { payment_date: p.payment_date, amount: p.amount, payment_method: "bank_transfer", payment_type: p.payment_type, note: p.note } })}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-12 text-center text-slate-400 text-sm">{listQuery.isLoading ? "Đang tải..." : "Không có công nợ nào trong khoảng thời gian này"}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Hiển:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"><option value={0}>Tất cả</option><option value={50}>50 / trang</option><option value={100}>100 / trang</option><option value={200}>200 / trang</option></select>
            <span className="text-slate-400">{totalCount} mục</span>
          </div>
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-2 py-1 rounded border border-slate-200 text-xs hover:bg-slate-100 disabled:opacity-40">&lt;</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => { if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, [])
                .map((p, i) => p === "..." ? <span key={`e${i}`} className="px-1 text-slate-400 text-xs">…</span> : <button key={p} onClick={() => setPage(p as number)} className={`px-2.5 py-1 rounded border text-xs transition-colors ${safePage === p ? "bg-rose-500 text-white border-rose-500 font-semibold" : "border-slate-200 hover:bg-slate-100"}`}>{p}</button>)}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="px-2 py-1 rounded border border-slate-200 text-xs hover:bg-slate-100 disabled:opacity-40">&gt;</button>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      <Modal title="Tạo công nợ phải trả" open={open} onCancel={() => setOpen(false)} confirmLoading={createMutation.isPending} onOk={() => createMutation.mutate({ ...form, lead_id: userLeadId, tax_amount: Math.round(form.base_amount * form.tax_rate / 100), total_amount: form.base_amount + Math.round(form.base_amount * form.tax_rate / 100) })} okText="Tạo" cancelText="Huỷ">
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div><label className="text-xs text-slate-500 mb-1 block">Nhà cung cấp *</label><input value={form.supplier_name} onChange={(e) => setForm((p) => ({ ...p, supplier_name: e.target.value }))} placeholder="Tên nhà cung cấp" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-slate-500 mb-1 block">Diễn giải</label><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Nội dung chi tiết..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[60px]" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-slate-500 mb-1 block">Ngày hóa đơn</label><input type="date" value={form.bill_date} onChange={(e) => setForm((p) => ({ ...p, bill_date: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Hạn thanh toán</label><input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-slate-500 mb-1 block">Số tiền trước thuế</label><MoneyInput value={form.base_amount} onChange={(n) => setForm((p) => ({ ...p, base_amount: n }))} className="w-full" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">VAT (%)</label><input type="number" value={form.tax_rate} onChange={(e) => setForm((p) => ({ ...p, tax_rate: Number(e.target.value || 0) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">Tổng: <strong className="text-rose-700">{fmt(form.base_amount + Math.round(form.base_amount * form.tax_rate / 100))} đ</strong></div>
        </div>
      </Modal>

      {/* Settings modal */}
      <Modal title="Cài đặt nhắc hạn" open={settingsOpen} onCancel={() => setSettingsOpen(false)} onOk={() => { localStorage.setItem("ap_reminder_days", String(reminderDays)); setSettingsOpen(false); }} okText="Lưu" cancelText="Huỷ">
        <div className="pt-2 space-y-3">
          <p className="text-sm text-slate-600">Nhắc về công nợ phải trả sắp đến hạn trong:</p>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 3, 7].map((d) => <button key={d} type="button" onClick={() => setReminderDays(d)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${reminderDays === d ? "bg-rose-500 text-white border-rose-500" : "border-slate-200 hover:bg-slate-50"}`}>{d === 0 ? "Tắt" : `${d} ngày`}</button>)}
          </div>
        </div>
      </Modal>
    </div>
  );
}

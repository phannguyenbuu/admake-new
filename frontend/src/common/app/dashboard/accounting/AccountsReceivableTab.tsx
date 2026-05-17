import React, { useState, useRef } from "react";
import { Modal, notification, Popconfirm } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Trash2, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import { useUser } from "../../../common/hooks/useUser";
import {
  AccountingErpService,
  type ArInvoice,
  type TaxCode,
} from "../../../services/accounting-erp.service";
import { SummaryCard } from "./shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format số có dấu phân cách phần ngàn (VD: 1.234.567) */
const fmt = (v: number | undefined | null) =>
  Number(v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });

/** Parse chuỗi có thể có dấu '.' hoặc ',' về số */
const parseMoney = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;

const sumPaymentsByType = (payments: Payment[], paymentType: "phat_sinh" | "tam_ung") =>
  payments
    .filter((payment) => payment.payment_type === paymentType)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

const getArRowTotals = (row: ArInvoice, payments?: Payment[]) => {
  if (payments) {
    const phatSinhAmount = sumPaymentsByType(payments, "phat_sinh");
    const tamUngAmount = sumPaymentsByType(payments, "tam_ung");
    const effectiveTotalAmount = Math.round((row.total_amount || 0) + phatSinhAmount * (1 + (row.tax_rate || 0) / 100));
    return {
      phatSinhAmount,
      tamUngAmount,
      effectiveTotalAmount,
      remainingAmount: effectiveTotalAmount - tamUngAmount,
    };
  }

  const phatSinhAmount = row.phat_sinh_amount || 0;
  const tamUngAmount = row.tam_ung_amount ?? row.paid_amount ?? 0;
  const effectiveTotalAmount = row.effective_total_amount ?? Math.round((row.total_amount || 0) + phatSinhAmount * (1 + (row.tax_rate || 0) / 100));
  const remainingAmount = row.balance_amount ?? (effectiveTotalAmount - tamUngAmount);
  return {
    phatSinhAmount,
    tamUngAmount,
    effectiveTotalAmount,
    remainingAmount,
  };
};

// ─── Inline text cell ─────────────────────────────────────────────────────────

function InlineText({
  value,
  onSave,
  className = "",
  type = "text",
  placeholder = "",
}: {
  value: string | number;
  onSave: (v: string) => void;
  className?: string;
  type?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value ?? ""));

  const commit = () => {
    setEditing(false);
    if (local !== String(value)) onSave(local);
  };

  if (editing) {
    return (
      <input
        type={type}
        value={local}
        autoFocus
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`w-full px-2 py-1 border border-teal-400 rounded-md text-sm outline-none bg-teal-50 ${className}`}
        placeholder={placeholder}
      />
    );
  }
  return (
    <span
      title="Nhấp để sửa"
      onClick={() => { setLocal(String(value ?? "")); setEditing(true); }}
      className={`inline-block w-full cursor-pointer rounded px-1 hover:bg-slate-100 transition-colors text-sm ${className}`}
    >
      {value !== "" && value !== null && value !== undefined
        ? value
        : <span className="text-slate-300 italic">{placeholder || "—"}</span>}
    </span>
  );
}

// ─── Amount input with thousand separator ─────────────────────────────────────

function MoneyInput({
  value,
  onChange,
  onEnter,
  placeholder = "Số tiền...",
  className = "",
}: {
  value: number;
  onChange: (n: number) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");

  const handleFocus = () => {
    setFocused(true);
    setRaw(value > 0 ? String(value) : "");
  };
  const handleBlur = () => {
    setFocused(false);
    onChange(parseMoney(raw));
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // chỉ giữ chữ số và dấu chấm thập phân
    setRaw(e.target.value.replace(/[^0-9.]/g, ""));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={focused ? raw : (value > 0 ? fmt(value) : "")}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleBlur();
          onEnter?.();
        }
      }}
      className={`border border-slate-200 rounded-md px-2 py-1 text-xs text-right ${className}`}
    />
  );
}

// ─── VAT Dropdown cell ────────────────────────────────────────────────────────

function InlineVAT({
  value,
  taxCodes,
  onSave,
}: {
  value: number;
  taxCodes: TaxCode[];
  onSave: (rate: number, taxCodeId: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  const outputCodes = taxCodes.filter(
    (t) => t.direction === "output" || t.direction === "both"
  );

  const matched = outputCodes.find((t) => t.rate === value);
  const label = matched ? `${matched.code} (${value}%)` : `${value}%`;

  if (editing) {
    return (
      <select
        autoFocus
        value={matched?.id || ""}
        className="text-xs border border-teal-400 rounded-md px-1 py-1 outline-none bg-teal-50 w-full"
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          setEditing(false);
          const chosen = outputCodes.find((t) => t.id === e.target.value);
          if (chosen) onSave(chosen.rate, chosen.id);
        }}
      >
        <option value="">-- Chọn thuế --</option>
        {outputCodes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.code} – {t.name} ({t.rate}%)
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      title="Nhấp để đổi mã thuế"
      onClick={() => setEditing(true)}
      className="inline-block cursor-pointer rounded px-1 hover:bg-slate-100 transition-colors text-sm w-full"
    >
      {outputCodes.length > 0 ? label : <span className="text-slate-400">{value}%</span>}
    </span>
  );
}

// ─── Payment row (with inline edit & delete) ──────────────────────────────────

type Payment = {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  note?: string;
};

type DailyCashRef = { id: string; voucher_no: string; description?: string; txn_date: string; amount: number; direction: string };

// ── Custom dropdown: chọn phiếu thu chi ───────────────────────────────────────
function TcDropdown({ value, onChange, list }: {
  value: string;
  onChange: (id: string) => void;
  list: DailyCashRef[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const chosen = list.find((d) => d.id === value);
  const visible = list.filter((d) =>
    !search || d.voucher_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 bg-white min-w-[148px] max-w-[220px] text-left transition-colors ${chosen ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:border-slate-300"
          }`}
      >
        {chosen ? (
          <span className="flex items-center gap-1 truncate">
            <span className={`font-semibold truncate ${chosen.direction === "income" ? "text-teal-700" : "text-rose-700"
              }`}>{chosen.voucher_no}</span>
            <span className="font-bold text-red-600 whitespace-nowrap">
              {Number(chosen.amount).toLocaleString("vi-VN")}đ
            </span>
          </span>
        ) : (
          <span className="text-slate-400">{list.length ? "💰 Phiếu TC..." : "(chưa có phiếu)"}</span>
        )}
        <span className="ml-auto text-slate-300 text-[10px]">&#9662;</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã phiếu..."
              className="w-full text-xs border border-slate-200 rounded px-2 py-1 outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div
              className="px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer italic"
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              — Không chọn phiếu —
            </div>
            {visible.length === 0 && (
              <div className="px-3 py-4 text-xs text-slate-300 text-center">Không tìm thấy</div>
            )}
            {visible.map((d) => {
              const isIncome = d.direction === "income";
              return (
                <div
                  key={d.id}
                  className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${value === d.id ? "bg-teal-50" : ""
                    }`}
                  onClick={() => { onChange(d.id); setOpen(false); setSearch(""); }}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${isIncome ? "bg-teal-100 text-teal-700" : "bg-rose-100 text-rose-700"
                      }`}>
                      {isIncome ? "⇓TN" : "⇑CP"}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{d.voucher_no}</span>
                  </span>
                  <span className="text-xs font-bold text-red-600 whitespace-nowrap">
                    {Number(d.amount).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              );
            })}
          </div>
          {chosen && (
            <div className="border-t border-slate-100 px-3 py-1.5 flex justify-end">
              <button
                type="button"
                className="text-[10px] text-rose-400 hover:text-rose-600 transition-colors"
                onClick={() => { onChange(""); setOpen(false); }}
              >
                &#10005; Bỏ chọn
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentRow({
  p,
  invoiceId,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onDeleted,
  onUpdated,
  dailyCashList,
}: {
  p: Payment;
  invoiceId: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDeleted: () => void;
  onUpdated: (updated: Payment) => void;
  dailyCashList: DailyCashRef[];
}) {
  const isTamUng = p.payment_type === "tam_ung";
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [dateVal, setDateVal] = useState(p.payment_date?.slice(0, 10) || dayjs().format("YYYY-MM-DD"));
  const [amtVal, setAmtVal] = useState(p.amount || 0);
  const [noteVal, setNoteVal] = useState(p.note || "");
  const [tcRefEdit, setTcRefEdit] = useState(() => {
    // Lấy lại dailyCashId từ note nếu có [TC:voucher_no]
    return "";  // sẽ resolve khi mở edit
  });

  // Sync khi p thay đổi hoặc khi thoát edit
  React.useEffect(() => {
    if (!isEditing) {
      setDateVal(p.payment_date?.slice(0, 10) || dayjs().format("YYYY-MM-DD"));
      setAmtVal(p.amount || 0);
      setNoteVal(p.note || "");
      setTcRefEdit("");
    }
  }, [p, isEditing]);

  // Khi bắt đầu edit: parse TC ref từ note
  const handleStartEdit = () => {
    const m = (p.note || "").match(/^\[TC:([^\]]+)\]\s*(.*)/);
    setNoteVal(m ? m[2] : (p.note || ""));
    setTcRefEdit(""); // sẽ match bằng voucher_no ở save
    setDateVal(p.payment_date?.slice(0, 10) || dayjs().format("YYYY-MM-DD"));
    setAmtVal(p.amount || 0);
    onStartEdit();
  };

  const saveEdit = async () => {
    if (amtVal <= 0) {
      notification.warning({ message: "Số tiền phải > 0" });
      return;
    }
    setSaving(true);
    try {
      // Build note: ưu tiên TC dropdown, rồi mới ghi chú thuần
      let finalNote = noteVal;
      if (isTamUng && tcRefEdit) {
        finalNote = `[TC:${tcRefEdit}]${noteVal ? " " + noteVal : ""}`;
      }
      const payload = {
        payment_date: dateVal,
        amount: amtVal,
        note: finalNote,
      };
      const res = await AccountingErpService.updateArPayment(invoiceId, p.id, payload);
      onUpdated({
        ...p,
        payment_date: res.data?.payment_date || dateVal,
        amount: res.data?.amount ?? amtVal,
        note: res.data?.note ?? finalNote,
      });
    } catch { /* noop */ }
    setSaving(false);
    onCancelEdit();
  };

  const handleDelete = async () => {
    try {
      await AccountingErpService.deleteArPayment(invoiceId, p.id);
      onDeleted();
    } catch (e: any) {
      const msg = e?.response?.data?.description || "Xóa thất bại";
      notification.error({ message: msg });
    }
  };

  /* ── render ─────────────────────────────────────────────────────────── */
  if (isEditing) {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-xs px-3 py-2 rounded-lg border ${isTamUng ? "bg-rose-50 border-rose-300" : "bg-teal-50 border-teal-300"
        }`}>
        {/* Badge loại */}
        <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap shrink-0 ${isTamUng ? "bg-rose-200 text-rose-700" : "bg-teal-200 text-teal-700"
          }`}>
          {isTamUng ? "Tạm ứng" : "Phát sinh"}
        </span>

        {/* Ngày */}
        <input
          type="date"
          value={dateVal}
          onChange={(e) => setDateVal(e.target.value)}
          className="border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none bg-white"
          disabled={saving}
        />

        {/* Số tiền */}
        <MoneyInput
          value={amtVal}
          onChange={setAmtVal}
          placeholder="Số tiền..."
          className="w-32"
        />

        {/* Phiếu TC — chỉ hiện phiếu thu (income) */}
        {isTamUng && (
          <TcDropdown
            value={tcRefEdit}
            onChange={setTcRefEdit}
            list={dailyCashList.filter((d) => d.direction === "income")}
          />
        )}

        {/* Ghi chú */}
        <input
          autoFocus
          value={noteVal}
          onChange={(e) => setNoteVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") onCancelEdit(); }}
          placeholder="Ghi chú..."
          className="flex-1 min-w-[120px] border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none bg-white"
          disabled={saving}
        />

        {/* Save / Cancel */}
        <button onClick={saveEdit} disabled={saving} className={`${isTamUng ? "text-rose-600 hover:text-rose-800" : "text-teal-600 hover:text-teal-800"}`}>
          <Check size={13} />
        </button>
        <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600">
          <X size={13} />
        </button>
      </div>
    );
  }

  /* ── view mode ────────────────────────────────────────────────────────── */
  return (
    <div className={`flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg border group/row ${isTamUng ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-teal-50 border-teal-200 text-teal-800"
      }`}>
      <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${isTamUng ? "bg-rose-200 text-rose-700" : "bg-teal-200 text-teal-700"
        }`}>
        {isTamUng ? "Tạm ứng" : "Phát sinh"}
      </span>
      <span className="whitespace-nowrap">{dayjs(p.payment_date).format("DD/MM/YYYY")}</span>
      <span className="font-semibold whitespace-nowrap">{fmt(p.amount)} đ</span>

      {/* Note display */}
      <span
        onClick={handleStartEdit}
        className="flex-1 text-slate-400 italic truncate max-w-[180px] cursor-pointer hover:text-slate-600 hover:not-italic"
        title="Nhấp để sửa"
      >
        {(() => {
          const m = (p.note || "").match(/^\[TC:([^\]]+)\]\s*(.*)/);
          if (m) return (
            <span className="flex items-center gap-1.5">
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${isTamUng ? "bg-rose-200 text-rose-700" : "bg-teal-200 text-teal-700"
                }`}>{m[1]}</span>
              {m[2] && <span className="text-slate-400 italic">{m[2]}</span>}
            </span>
          );
          return p.note || <span className="text-slate-300 italic">Thêm ghi chú...</span>;
        })()}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity ml-auto">
        <button
          onClick={handleStartEdit}
          title="Sửa"
          className={`p-1 rounded hover:bg-white transition-colors ${isTamUng ? "text-rose-400" : "text-teal-400"}`}
        >
          <Pencil size={11} />
        </button>
        <Popconfirm
          title="Xóa đợt thanh toán này?"
          okText="Xóa"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          onConfirm={handleDelete}
        >
          <button title="Xóa" className="p-1 rounded hover:bg-white text-rose-400 hover:text-rose-600 transition-colors">
            <Trash2 size={11} />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
}

// ─── Payment sub-row ──────────────────────────────────────────────────────────

type AddPaymentForm = {
  amount: number;
  payment_type: "phat_sinh" | "tam_ung";
  payment_date: string;
  note: string;
};

function PaymentSubRow({
  payments,
  invoiceId,
  invoiceStatus,
  onAddPayment,
  addingLoading,
  onPaymentsChanged,
  dailyCashList,
}: {
  payments: Payment[];
  invoiceId: string;
  invoiceStatus: string;
  onAddPayment: (p: AddPaymentForm) => void;
  addingLoading: boolean;
  onPaymentsChanged: (updated: Payment[]) => void;
  dailyCashList: DailyCashRef[];
}) {
  const [addForm, setAddForm] = useState<AddPaymentForm>({
    amount: 0,
    payment_type: "phat_sinh",
    payment_date: dayjs().format("YYYY-MM-DD"),
    note: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tcRef, setTcRef] = useState(""); // selected daily-cash id

  const handleAdd = (form: AddPaymentForm) => {
    const chosen = form.payment_type === "tam_ung" ? dailyCashList.find((d) => d.id === tcRef) : undefined;
    const noteWithRef = chosen
      ? `[TC:${chosen.voucher_no}]${form.note ? " " + form.note : ""}`
      : form.note;
    setEditingId(null);
    setTcRef("");
    onAddPayment({ ...form, note: noteWithRef });
  };

  const canAdd = invoiceStatus !== "cancelled";

  return (
    <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100">
      <div className="flex flex-col gap-1.5">
        {payments.length === 0 && !canAdd && (
          <span className="text-xs text-slate-400 italic">Chưa có đợt thanh toán</span>
        )}

        {payments.map((p) => (
          <PaymentRow
            key={p.id}
            p={p}
            invoiceId={invoiceId}
            dailyCashList={dailyCashList}
            isEditing={editingId === p.id}
            onStartEdit={() => setEditingId(p.id)}
            onCancelEdit={() => setEditingId(null)}
            onDeleted={() => {
              setEditingId(null);
              onPaymentsChanged(payments.filter((x) => x.id !== p.id));
            }}
            onUpdated={(updated) => {
              setEditingId(null);
              onPaymentsChanged(payments.map((x) => (x.id === updated.id ? updated : x)));
            }}
          />
        ))}

        {/* Quick-add row */}
        {canAdd && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <select
              value={addForm.payment_type}
              onChange={(e) => {
                const nextType = e.target.value as "phat_sinh" | "tam_ung";
                setAddForm((p) => ({ ...p, payment_type: nextType }));
                if (nextType !== "tam_ung") setTcRef("");
              }}
              className={`text-xs border rounded-md px-2 py-1 cursor-pointer ${addForm.payment_type === "tam_ung"
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-teal-300 bg-teal-50 text-teal-700"
                }`}
            >
              <option value="phat_sinh">Phát sinh</option>
              <option value="tam_ung">Tạm ứng</option>
            </select>

            <input
              type="date"
              value={addForm.payment_date}
              onChange={(e) => setAddForm((p) => ({ ...p, payment_date: e.target.value }))}
              className="text-xs border border-slate-200 rounded-md px-2 py-1"
            />

            {/* Amount with thousand separator */}
            <MoneyInput
              value={addForm.amount}
              onChange={(n) => setAddForm((p) => ({ ...p, amount: n }))}
              onEnter={() => {
                if (!addForm.amount || addForm.amount <= 0) {
                  notification.warning({ message: "Vui lòng nhập số tiền > 0" });
                  return;
                }
                onAddPayment(addForm);
                setAddForm((p) => ({ ...p, amount: 0, note: "" }));
              }}
              placeholder="Số tiền..."
              className="w-36"
            />

            <input
              value={addForm.note}
              onChange={(e) => setAddForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Ghi chú..."
              className="text-xs border border-slate-200 rounded-md px-2 py-1 flex-1 min-w-[120px]"
            />

            {/* Custom dropdown link phiếu thu chi */}
            {addForm.payment_type === "tam_ung" && (
              <TcDropdown
                value={tcRef}
                onChange={setTcRef}
                list={dailyCashList.filter((d) => d.direction === "income")}
              />
            )}

            <button
              type="button"
              disabled={addingLoading}
              onClick={() => {
                if (!addForm.amount || addForm.amount <= 0) {
                  notification.warning({ message: "Vui lòng nhập số tiền > 0" });
                  return;
                }
                handleAdd(addForm);
                setAddForm((p) => ({ ...p, amount: 0, note: "" }));
              }}
              className={`text-xs text-white px-3 py-1 rounded-md transition-colors whitespace-nowrap ${addingLoading ? "opacity-40 cursor-not-allowed" : ""
                } ${addForm.payment_type === "tam_ung"
                  ? "bg-rose-500 hover:bg-rose-600"
                  : "bg-teal-500 hover:bg-teal-600"
                }`}
            >
              {addingLoading ? "Đang lưu..." : "+ Lưu"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = {
  customer_name: "",
  description: "",
  invoice_date: dayjs().format("YYYY-MM-DD"),
  due_date: dayjs().add(30, "day").format("YYYY-MM-DD"),
  base_amount: 0,
  tax_rate: 10,
  tax_code_id: "",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AccountsReceivableTab() {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: string) => {
    setPage(1);
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };
  const clearSort = (field: string) => {
    if (sortField === field) { setSortField(null); setPage(1); }
  };

  // ── Fetch params (date range cho API) ───────────────────────────────
  const [fromDate, setFromDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  // Client-side filters
  const [filterVat, setFilterVat] = useState("");         // tax_rate as string, or ""
  const [filterStatus, setFilterStatus] = useState("");   // invoice status
  const [filterPaid, setFilterPaid] = useState("");       // "" | "unpaid" | "partial" | "paid"

  const hasActiveFilter = !!(filterVat || filterStatus || filterPaid);

  const params = {
    lead: userLeadId,
    from_date: fromDate,
    to_date: toDate,
    search: keyword || undefined,
    page: 1,
    limit: 500,
  };

  const listQuery = useQuery({
    queryKey: ["ar-list", params],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.listArInvoices(params)).data,
  });

  const taxQuery = useQuery({
    queryKey: ["tax-codes", userLeadId],
    enabled: !!userLeadId,
    queryFn: async () =>
      ((await AccountingErpService.listTaxCodes({ lead: userLeadId })).data?.data || []) as TaxCode[],
    staleTime: 5 * 60 * 1000,
  });

  const taxCodes: TaxCode[] = taxQuery.data || [];

  const taskQuery = useQuery({
    queryKey: ["tasks-inlead", userLeadId],
    enabled: !!userLeadId,
    queryFn: async () => {
      const res = await import("../../../services/task.service").then((m) =>
        m.TaskService ? m.TaskService : null
      );
      // Dùng trực tiếp axiosClient giống các màn hình khác
      const { default: axiosClient } = await import("../../../services/axiosClient");
      const data = await axiosClient.get(`/task/inlead/${userLeadId}`);
      return (data.data || []) as { id: string; title: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const tasks = taskQuery.data || [];

  // ── Daily Cash list (cùng tháng, dùng để link phếu TC vào payment) ──────────
  const dailyCashQuery = useQuery({
    queryKey: ["daily-cash-list", userLeadId, month],
    enabled: !!userLeadId,
    queryFn: async () => {
      const { default: axiosClient } = await import("../../../services/axiosClient");
      const res = await axiosClient.get(`/accounting/daily-cash`, {
        params: {
          lead: userLeadId,
          from_date: dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"),
          to_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
          limit: 200,
        },
      });
      return (res.data?.data || []) as DailyCashRef[];
    },
    staleTime: 2 * 60 * 1000,
  });
  const dailyCashList = dailyCashQuery.data || [];

  // ── Accounting settings (nhắc hạn thanh toán) ──────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(() => {
    const saved = localStorage.getItem("ar_reminder_days");
    return saved !== null ? Number(saved) : 3;
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["ar-list"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => AccountingErpService.createArInvoice(payload),
    onSuccess: async () => {
      notification.success({ message: "Đã tạo công nợ phải thu" });
      setOpen(false);
      setForm(emptyForm);
      await invalidate();
    },
    onError: (e: any) =>
      notification.error({ message: e?.response?.data?.description || "Lỗi tạo công nợ" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) =>
      AccountingErpService.updateArInvoice(id, payload),
    onMutate: async ({ id, payload }) => {
      // Huỷ refetch đang pending để tránh ghi đè optimistic
      await queryClient.cancelQueries({ queryKey: ["ar-list"] });
      // Snapshot dữ liệu hiện tại để rollback
      const previousData = queryClient.getQueriesData({ queryKey: ["ar-list"] });
      // Cập nhật cache ngay lập tức
      queryClient.setQueriesData({ queryKey: ["ar-list"] }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((item: ArInvoice) =>
            item.id === id ? { ...item, ...payload } : item
          ),
        };
      });
      return { previousData };
    },
    onSuccess: () => {
      notification.success({ message: "Đã lưu", duration: 1.5 });
    },
    onError: (e: any, _vars, context) => {
      // Rollback về dữ liệu cũ
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      notification.error({ message: e?.response?.data?.description || "Cập nhật thất bại" });
    },
    onSettled: () => {
      // Đồng bộ lại với server sau khi xong
      queryClient.invalidateQueries({ queryKey: ["ar-list"] });
    },
  });


  const deleteMutation = useMutation({
    mutationFn: (row: ArInvoice) => AccountingErpService.cancelArInvoice(row.id),
    onSuccess: async () => {
      notification.success({ message: "Đã xoá công nợ" });
      await invalidate();
    },
    onError: (e: any) =>
      notification.error({ message: e?.response?.data?.description || "Xoá thất bại" }),
  });

  const paymentMutation = useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: string;
      payload: Record<string, any>;
    }) => AccountingErpService.recordArPayment(invoiceId, payload),
    onSuccess: async (_res, { invoiceId }) => {
      notification.success({ message: "Đã thêm đợt thanh toán" });
      await invalidate();
      // Reload payments từ detail API để đảm bảo đúng type
      try {
        const detail = await AccountingErpService.getArInvoice(invoiceId);
        setPaymentsMap((prev) => ({
          ...prev,
          [invoiceId]: (detail.data?.payments || []) as Payment[],
        }));
      } catch { /* ignore */ }
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.description ||
        e?.response?.data?.message ||
        e?.message ||
        "Lỗi thêm thanh toán";
      notification.error({ message: msg });
    },
  });


  const handleInlineUpdate = (row: ArInvoice, field: string, rawValue: string | number) => {
    const payload: Record<string, any> = { [field]: rawValue };
    if (field === "base_amount" || field === "tax_rate") {
      const base = field === "base_amount" ? Number(rawValue) : row.base_amount;
      const rate = field === "tax_rate" ? Number(rawValue) : row.tax_rate;
      payload.base_amount = base;
      payload.tax_rate = rate;
      payload.tax_amount = Math.round(base * rate / 100);
      payload.total_amount = base + payload.tax_amount;
    }
    updateMutation.mutate({ id: row.id, payload });
  };

  const handleVATChange = (row: ArInvoice, rate: number, taxCodeId: string | null) => {
    const base = row.base_amount;
    const taxAmt = Math.round(base * rate / 100);
    updateMutation.mutate({
      id: row.id,
      payload: {
        tax_rate: rate,
        tax_code_id: taxCodeId,
        tax_amount: taxAmt,
        total_amount: base + taxAmt,
      },
    });
  };

  const toggleExpand = async (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!paymentsMap[id]) {
      try {
        const res = await AccountingErpService.getArInvoice(id);
        setPaymentsMap((prev) => ({
          ...prev,
          [id]: (res.data?.payments || []) as Payment[],
        }));
      } catch { /* ignore */ }
    }
  };

  const allRows = (listQuery.data?.data || []) as ArInvoice[];
  const summary = listQuery.data?.summary || {};

  const outputTaxCodes = taxCodes.filter(
    (t) => t.direction === "output" || t.direction === "both"
  );

  // ── Client-side filter + sort + paginate ────────────────────────────
  let filteredRows = allRows;

  if (filterVat !== "") {
    filteredRows = filteredRows.filter((r) => String(r.tax_rate ?? "") === filterVat);
  }
  if (filterStatus) {
    filteredRows = filteredRows.filter((r) => r.status === filterStatus);
  }
  if (filterPaid === "unpaid") {
    filteredRows = filteredRows.filter((r) => {
      const totals = getArRowTotals(r, paymentsMap[r.id]);
      return totals.tamUngAmount <= 0;
    });
  } else if (filterPaid === "partial") {
    filteredRows = filteredRows.filter((r) => {
      const totals = getArRowTotals(r, paymentsMap[r.id]);
      return totals.tamUngAmount > 0 && totals.tamUngAmount < totals.effectiveTotalAmount;
    });
  } else if (filterPaid === "paid") {
    filteredRows = filteredRows.filter((r) => {
      const totals = getArRowTotals(r, paymentsMap[r.id]);
      return totals.tamUngAmount >= totals.effectiveTotalAmount;
    });
  }

  // Sort client-side — đa cột
  const sortedRows = (() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      switch (sortField) {
        case "code": aVal = a.code || ""; bVal = b.code || ""; break;
        case "date": aVal = a.invoice_date || ""; bVal = b.invoice_date || ""; break;
        case "desc": aVal = (a.description || "").toLowerCase(); bVal = (b.description || "").toLowerCase(); break;
        case "vat": aVal = a.tax_rate ?? 0; bVal = b.tax_rate ?? 0; break;
        case "revenue": {
          aVal = getArRowTotals(a, paymentsMap[a.id]).effectiveTotalAmount;
          bVal = getArRowTotals(b, paymentsMap[b.id]).effectiveTotalAmount;
          break;
        }
        case "collected":
          aVal = getArRowTotals(a, paymentsMap[a.id]).tamUngAmount;
          bVal = getArRowTotals(b, paymentsMap[b.id]).tamUngAmount;
          break;
        case "remaining": {
          aVal = getArRowTotals(a, paymentsMap[a.id]).remainingAmount;
          bVal = getArRowTotals(b, paymentsMap[b.id]).remainingAmount;
          break;
        }
        case "due": aVal = a.due_date || ""; bVal = b.due_date || ""; break;
        default: break;
      }
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  })();

  // Pagination client-side
  const totalCount = sortedRows.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const rows = pageSize === 0 ? sortedRows : sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Due-soon banner */}
      {(() => {
        const today = dayjs();
        const dueSoon = allRows.filter((r) => {
          if (!r.due_date || r.status === "paid" || r.status === "cancelled") return false;
          const diff = dayjs(r.due_date).diff(today, "day");
          return diff >= 0 && diff <= reminderDays;
        });
        if (!dueSoon.length || reminderDays === 0) return null;
        return (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800">
            <span className="text-base">&#9888;&#65039;</span>
            <span><strong>{dueSoon.length}</strong> hóa đơn sắp đến hạn trong <strong>{reminderDays} ngày</strong> tới</span>
            <button onClick={() => setSettingsOpen(true)} className="ml-auto text-amber-500 underline text-xs hover:text-amber-700">Cài đặt nhắc</button>
          </div>
        );
      })()}
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Tổng phải thu" value={`${fmt(summary.total_receivable || 0)} đ`} tone="teal" />
        <SummaryCard label="Đã thu (tạm ứng)" value={`${fmt(summary.paid_amount || 0)} đ`} tone="emerald" />
        <SummaryCard label="Còn phải thu" value={`${fmt(summary.outstanding_amount || 0)} đ`} tone="amber" />
        <SummaryCard label="Quá hạn" value={`${fmt(summary.overdue_amount || 0)} đ`} tone="rose" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        {/* Row 1: date range + keyword */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <span className="text-xs text-slate-400 whitespace-nowrap">Từ</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="text-sm outline-none bg-transparent"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">&#8594;</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="text-sm outline-none bg-transparent"
            />
          </div>
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="Tìm mã / nội dung..."
            className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          {/* Settings button with badge */}
          <button
            onClick={() => setSettingsOpen(true)}
            title="Cài đặt kế toán"
            className="relative border border-slate-200 rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            &#9881;
            {(() => {
              const today = dayjs();
              const cnt = allRows.filter((r) => {
                if (!r.due_date || r.status === "paid" || r.status === "cancelled") return false;
                const diff = dayjs(r.due_date).diff(today, "day");
                return diff >= 0 && diff <= reminderDays;
              }).length;
              return cnt > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{cnt}</span>
              ) : null;
            })()}
          </button>
          <button
            className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-teal-600 transition-colors whitespace-nowrap"
            onClick={() => setOpen(true)}
          >
            + Tạo Công nợ
          </button>
        </div>

        {/* Row 2: column filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* VAT */}
          <select
            value={filterVat}
            onChange={(e) => { setFilterVat(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600"
          >
            <option value="">VAT: Tất cả</option>
            {outputTaxCodes.map((tc) => (
              <option key={tc.id} value={String(tc.rate ?? 0)}>
                {tc.code} ({tc.rate ?? 0}%)
              </option>
            ))}
          </select>


          {/* Trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600"
          >
            <option value="">Trạng thái: Tất cả</option>
            {[...new Set(allRows.map((r) => r.status).filter(Boolean))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Thanh toán */}
          <select
            value={filterPaid}
            onChange={(e) => { setFilterPaid(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600"
          >
            <option value="">Thanh toán: Tất cả</option>
            <option value="unpaid">Chưa thu</option>
            <option value="partial">Thu một phần</option>
            <option value="paid">Đã thu đủ</option>
          </select>

          {/* Active filter count + Reset */}
          {hasActiveFilter && (
            <button
              onClick={() => { setFilterVat(""); setFilterStatus(""); setFilterPaid(""); setPage(1); }}
              className="flex items-center gap-1 text-xs text-rose-500 border border-rose-200 rounded-lg px-2.5 py-1.5 hover:bg-rose-50 transition-colors"
            >
              &#10005; Xóa bộ lọc
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400">
            {filteredRows.length !== allRows.length
              ? `${filteredRows.length} / ${allRows.length} mục`
              : `${allRows.length} mục`}
          </span>
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
                { key: "desc", label: "Nội dung", cls: "" },
                { key: "vat", label: "VAT", cls: "w-40" },
                { key: "revenue", label: "Doanh Thu", cls: "", style: { minWidth: 260 } },
                { key: "collected", label: "Dã Thu", cls: "w-36" },
                { key: "remaining", label: "Còn Lại", cls: "w-36" },
                { key: "due", label: "Hạn TT", cls: "w-32" },
              ] as { key: string; label: string; cls: string; style?: React.CSSProperties }[]).map(({ key, label, cls, style }) => (
                <th
                  key={key}
                  className={`px-3 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors ${cls}`}
                  style={style}
                  onClick={() => toggleSort(key)}
                  onDoubleClick={() => clearSort(key)}
                  title="Click để sắp xếp, double-click để tắt"
                >
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    {label}
                    <span className={`text-[10px] ${sortField === key ? "text-teal-500" : "text-slate-300"
                      }`}>
                      {sortField === key ? (sortDir === "asc" ? "▲" : "▼") : "▲▼"}
                    </span>
                  </span>
                </th>
              ))}
              <th className="px-3 py-3 text-center w-12">Xoá</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expanded.has(row.id);
              const pmts = paymentsMap[row.id] || [];

              // Phát sinh + Tạm ứng (từ list API hoặc local payments)
              const rowTotals = getArRowTotals(row, paymentsMap[row.id]);
              const psAmt = rowTotals.phatSinhAmount;

              // Doanh thu = (base + phát sinh) × (1 + VAT%)
              const totalReceivable = rowTotals.effectiveTotalAmount;
              // Đã thu = tổng tạm ứng
              const collected = rowTotals.tamUngAmount;
              // Còn lại = doanh thu − đã thu
              const remaining = rowTotals.remainingAmount;

              return (
                <React.Fragment key={row.id}>
                  <tr className="border-b last:border-0 hover:bg-slate-50/60 group transition-colors">

                    {/* Expand */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(row.id)}
                        className="text-slate-400 hover:text-teal-600 transition-colors"
                        title="Xem đợt thanh toán"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>

                    {/* Mã / Ngày */}
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-700 text-xs leading-tight">{row.code}</div>
                      <InlineText
                        type="date"
                        value={row.invoice_date || ""}
                        onSave={(v) => handleInlineUpdate(row, "invoice_date", v)}
                        className="text-[11px] text-slate-400"
                      />
                    </td>

                    {/* Nội dung: chỉ task dropdown */}
                    <td className="px-3 py-2 min-w-[180px]">
                      <InlineText
                        value={row.customer_name || ""}
                        placeholder="Khách hàng"
                        onSave={(v) => handleInlineUpdate(row, "customer_name", v)}
                      />
                      {/* Task dropdown — 1 task duy nhất, lưu vào description */}
                      <select
                        title="Gắn công việc"
                        value={tasks.find((t) => t.title === row.description)?.id || ""}
                        onChange={(e) => {
                          const t = tasks.find((x) => x.id === e.target.value);
                          handleInlineUpdate(row, "description", t ? t.title : "");
                        }}
                        className="mt-0.5 w-full text-[11px] text-slate-600 border border-slate-200 rounded px-1 py-0.5 bg-white hover:border-teal-400 cursor-pointer"
                      >
                        <option value="">{tasks.length ? "-- Chọn công việc --" : "(Chưa có task)"}</option>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </td>

                    {/* VAT dropdown */}
                    <td className="px-3 py-2">
                      <InlineVAT
                        value={row.tax_rate ?? 0}
                        taxCodes={taxCodes}
                        onSave={(rate, taxCodeId) => handleVATChange(row, rate, taxCodeId)}
                      />
                    </td>

                    {/* Amount block: (base + PS) × (1+VAT%) */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 text-xs flex-wrap">
                        <InlineText
                          type="text"
                          value={fmt(row.base_amount || 0)}
                          placeholder="0"
                          onSave={(v) => handleInlineUpdate(row, "base_amount", parseMoney(v))}
                          className="w-28 text-left"
                        />
                        {psAmt > 0 && (
                          <span className="text-teal-600 font-medium">+{fmt(psAmt)}</span>
                        )}
                        <span className="text-slate-400">×(1+{row.tax_rate || 0}%)</span>
                        <span className="font-semibold text-teal-700">=&nbsp;{fmt(totalReceivable)} đ</span>
                      </div>
                    </td>


                    {/* Đã thu = tạm ứng */}
                    <td className="px-3 py-2 text-emerald-700 font-medium text-sm">{fmt(collected)} đ</td>

                    {/* Còn lại */}
                    <td className="px-3 py-2 text-amber-700 font-medium text-sm">{fmt(remaining)} đ</td>

                    {/* Hạn TT */}
                    <td className="px-3 py-2">
                      <InlineText
                        type="date"
                        value={row.due_date || ""}
                        placeholder="Chưa đặt"
                        onSave={(v) => handleInlineUpdate(row, "due_date", v)}
                        className="text-xs"
                      />
                    </td>

                    {/* Xoá — luôn hiển thị */}
                    <td className="px-3 py-2 text-center">
                      <Popconfirm
                        title="Xoá công nợ này?"
                        description="Hành động không thể hoàn tác."
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deleteMutation.mutate(row)}
                      >
                        <button
                          title="Xoá"
                          className="p-1.5 rounded-md border border-rose-200 text-rose-500 hover:text-rose-700 hover:border-rose-400 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </Popconfirm>
                    </td>
                  </tr>

                  {/* Sub-row: payments */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={9} className="p-0">
                        <PaymentSubRow
                          payments={pmts}
                          invoiceId={row.id}
                          invoiceStatus={row.status}
                          addingLoading={paymentMutation.isPending}
                          dailyCashList={dailyCashList}
                          onPaymentsChanged={(updated) =>
                            setPaymentsMap((prev) => ({ ...prev, [row.id]: updated }))
                          }
                          onAddPayment={(p) =>
                            paymentMutation.mutate({
                              invoiceId: row.id,
                              payload: {
                                payment_date: p.payment_date,
                                amount: p.amount,
                                payment_method: "bank_transfer",
                                payment_type: p.payment_type,
                                note: p.note,
                              },
                            })
                          }
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-slate-400 text-sm">
                  {listQuery.isLoading ? "Đang tải..." : "Không có công nợ nào trong tháng này"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Hiển:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
            >
              <option value={0}>Tất cả</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
              <option value={200}>200 / trang</option>
            </select>
            <span className="text-slate-400">{totalCount} mục</span>
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-2 py-1 rounded border border-slate-200 text-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`px-2.5 py-1 rounded border text-xs transition-colors ${safePage === p
                        ? "bg-teal-500 text-white border-teal-500 font-semibold"
                        : "border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-2 py-1 rounded border border-slate-200 text-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      <Modal
        title="Tạo công nợ phải thu"
        open={open}
        onCancel={() => setOpen(false)}
        confirmLoading={createMutation.isPending}
        onOk={() =>
          createMutation.mutate({
            ...form,
            lead_id: userLeadId,
            tax_amount: Math.round(form.base_amount * form.tax_rate / 100),
            total_amount: form.base_amount + Math.round(form.base_amount * form.tax_rate / 100),
          })
        }
        okText="Tạo"
        cancelText="Huỷ"
      >
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Nội dung / Khách hàng *</label>
            <input
              value={form.customer_name}
              onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
              placeholder="Tên khách hàng hoặc nội dung"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Diễn giải (Kế toán/thuế)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Nội dung chi tiết từ chứng từ kế toán..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Công việc liên quan</label>
            <select
              value={tasks.find((t) => t.title === form.description)?.id || ""}
              onChange={(e) => {
                const t = tasks.find((x) => x.id === e.target.value);
                setForm((p) => ({ ...p, description: t ? t.title : "" }));
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{tasks.length ? "-- Chọn công việc --" : "(Chưa có task)"}</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Ngày hoá đơn</label>
              <input
                type="date"
                value={form.invoice_date}
                onChange={(e) => setForm((p) => ({ ...p, invoice_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Hạn thanh toán</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Trước thuế (đ)</label>
              <MoneyInput
                value={form.base_amount}
                onChange={(n) => setForm((p) => ({ ...p, base_amount: n }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mã thuế VAT</label>
              <select
                value={form.tax_code_id}
                onChange={(e) => {
                  const chosen = outputTaxCodes.find((t) => t.id === e.target.value);
                  setForm((p) => ({
                    ...p,
                    tax_code_id: e.target.value,
                    tax_rate: chosen?.rate ?? p.tax_rate,
                  }));
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Chọn mã thuế --</option>
                {outputTaxCodes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} – {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.base_amount > 0 && (
            <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 text-xs text-slate-600 flex gap-4">
              <span>
                VAT ({form.tax_rate}%):{" "}
                <strong>{fmt(Math.round(form.base_amount * form.tax_rate / 100))} đ</strong>
              </span>
              <span>
                Tổng phải thu:{" "}
                <strong className="text-teal-700">
                  {fmt(form.base_amount + Math.round(form.base_amount * form.tax_rate / 100))} đ
                </strong>
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Accounting Settings Modal ──────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">&#9881;&#65039;</span>
            <span>Cài đặt Kế toán</span>
          </div>
        }
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        onOk={() => {
          localStorage.setItem("ar_reminder_days", String(reminderDays));
          setSettingsOpen(false);
          notification.success({ message: "Đã lưu cài đặt", duration: 1.5 });
        }}
        okText="Lưu"
        cancelText="Huỷ"
        width={400}
      >
        <div className="grid gap-4 py-2">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              🔔 Nhắc trước hạn thanh toán
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Hệ thống sẽ cảnh báo các hóa đơn sắp đến hạn trong vòng số ngày chịn bên dưới.
            </p>
            <div className="flex gap-2">
              {[0, 1, 3, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setReminderDays(d)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${reminderDays === d
                    ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {d === 0 ? "Khi đến hạn" : `${d} ngày`}
                </button>
              ))}
            </div>
          </div>

          {/* Preview: số invoice sắp đến hạn */}
          {(() => {
            const today = dayjs();
            const dueSoon = allRows.filter((r) => {
              if (!r.due_date || r.status === "paid" || r.status === "cancelled") return false;
              const diff = dayjs(r.due_date).diff(today, "day");
              return diff >= 0 && diff <= reminderDays;
            });
            if (!dueSoon.length) return null;
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                ⚠️ <strong>{dueSoon.length}</strong> hóa đơn đến hạn trong {reminderDays} ngày tới
              </div>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}

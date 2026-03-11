import React, { useState } from "react";
import { Modal, notification } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useUser } from "../../../common/hooks/useUser";
import { AccountingErpService, type ApBill } from "../../../services/accounting-erp.service";
import { formatMoney, StatusBadge, SummaryCard } from "./shared";

const emptyForm = {
  supplier_name: "",
  bill_date: dayjs().format("YYYY-MM-DD"),
  due_date: dayjs().add(30, "day").format("YYYY-MM-DD"),
  expense_account_code: "642",
  base_amount: 0,
  tax_rate: 10,
  description: "",
};

export default function AccountsPayableTab() {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [paymentTarget, setPaymentTarget] = useState<ApBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const params = {
    lead: userLeadId,
    from_date: dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"),
    to_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
    status: status || undefined,
    search: keyword || undefined,
    page: 1,
    limit: 200,
  };

  const listQuery = useQuery({
    queryKey: ["ap-list", params],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.listApBills(params)).data,
  });

  const agingQuery = useQuery({
    queryKey: ["ap-aging", userLeadId, month],
    enabled: !!userLeadId,
    queryFn: async () =>
      (await AccountingErpService.getApAging({ lead: userLeadId, as_of: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD") })).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => AccountingErpService.createApBill(payload),
    onSuccess: async () => {
      notification.success({ message: "Đã tạo hóa đơn phải trả" });
      setOpen(false);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["ap-list"] });
      await queryClient.invalidateQueries({ queryKey: ["ap-aging"] });
    },
    onError: (error: any) => notification.error({ message: error?.response?.data?.description || "Tạo AP thất bại" }),
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: { type: "confirm" | "cancel" | "payment"; row: ApBill; amount?: number }) => {
      if (payload.type === "confirm") return AccountingErpService.confirmApBill(payload.row.id);
      if (payload.type === "cancel") return AccountingErpService.cancelApBill(payload.row.id);
      return AccountingErpService.recordApPayment(payload.row.id, {
        payment_date: dayjs().format("YYYY-MM-DD"),
        amount: payload.amount || 0,
        payment_method: "bank_transfer",
      });
    },
    onSuccess: async () => {
      notification.success({ message: "Đã cập nhật công nợ phải trả" });
      setPaymentTarget(null);
      setPaymentAmount(0);
      await queryClient.invalidateQueries({ queryKey: ["ap-list"] });
      await queryClient.invalidateQueries({ queryKey: ["ap-aging"] });
    },
    onError: (error: any) => notification.error({ message: error?.response?.data?.description || "Cập nhật AP thất bại" }),
  });

  const rows = (listQuery.data?.data || []) as ApBill[];
  const summary = listQuery.data?.summary || {};

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard label="Tổng phải trả" value={`${formatMoney(summary.total_payable || 0)} đ`} tone="teal" />
        <SummaryCard label="Đã trả" value={`${formatMoney(summary.paid_amount || 0)} đ`} tone="emerald" />
        <SummaryCard label="Còn phải trả" value={`${formatMoney(summary.outstanding_amount || 0)} đ`} tone="amber" />
        <SummaryCard label="Quá hạn" value={`${formatMoney(summary.overdue_amount || 0)} đ`} tone="rose" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[140px_180px_1fr_auto] gap-3">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="">Tất cả trạng thái</option>
          <option value="draft">draft</option>
          <option value="confirmed">confirmed</option>
          <option value="partially_paid">partially_paid</option>
          <option value="paid">paid</option>
          <option value="overdue">overdue</option>
          <option value="cancelled">cancelled</option>
        </select>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm mã hóa đơn / NCC" className="border border-slate-200 rounded-lg px-3 py-2" />
        <button className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>
          + Tạo AP
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left min-w-[1250px]">
          <thead>
            <tr className="text-xs text-slate-500 border-b bg-slate-50">
              <th className="px-3 py-3">Mã hóa đơn</th>
              <th className="px-3 py-3">Ngày</th>
              <th className="px-3 py-3">Nhà cung cấp</th>
              <th className="px-3 py-3">Trước thuế</th>
              <th className="px-3 py-3">VAT</th>
              <th className="px-3 py-3">Tổng tiền</th>
              <th className="px-3 py-3">Đã trả</th>
              <th className="px-3 py-3">Còn lại</th>
              <th className="px-3 py-3">Hạn thanh toán</th>
              <th className="px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/70">
                <td className="px-3 py-3 font-medium text-slate-700">{row.code}</td>
                <td className="px-3 py-3">{dayjs(row.bill_date).format("DD/MM/YYYY")}</td>
                <td className="px-3 py-3">{row.supplier_name}</td>
                <td className="px-3 py-3">{formatMoney(row.base_amount)} đ</td>
                <td className="px-3 py-3">{formatMoney(row.tax_amount)} đ</td>
                <td className="px-3 py-3">{formatMoney(row.total_amount)} đ</td>
                <td className="px-3 py-3 text-emerald-700">{formatMoney(row.paid_amount)} đ</td>
                <td className="px-3 py-3 text-amber-700">{formatMoney(row.balance_amount)} đ</td>
                <td className="px-3 py-3">{row.due_date ? dayjs(row.due_date).format("DD/MM/YYYY") : "-"}</td>
                <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {row.status === "draft" && <button className="px-2 py-1 text-xs border rounded-md" onClick={() => actionMutation.mutate({ type: "confirm", row })}>Confirm</button>}
                    {(row.status === "confirmed" || row.status === "partially_paid" || row.status === "overdue") && (
                      <button className="px-2 py-1 text-xs border rounded-md border-emerald-200 text-emerald-700" onClick={() => { setPaymentTarget(row); setPaymentAmount(row.balance_amount); }}>
                        Thanh toán
                      </button>
                    )}
                    {(row.status === "draft" || row.status === "confirmed") && (
                      <button className="px-2 py-1 text-xs border rounded-md border-rose-200 text-rose-700" onClick={() => actionMutation.mutate({ type: "cancel", row })}>
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Tạo công nợ phải trả" open={open} onCancel={() => setOpen(false)} onOk={() => createMutation.mutate({ ...form, lead_id: userLeadId })}>
        <div className="grid grid-cols-1 gap-3 pt-2">
          <input value={form.supplier_name} onChange={(e) => setForm((p) => ({ ...p, supplier_name: e.target.value }))} placeholder="Nhà cung cấp" className="border border-slate-200 rounded-lg px-3 py-2" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.bill_date} onChange={(e) => setForm((p) => ({ ...p, bill_date: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2" />
            <input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input value={form.expense_account_code} onChange={(e) => setForm((p) => ({ ...p, expense_account_code: e.target.value }))} placeholder="TK chi phí" className="border border-slate-200 rounded-lg px-3 py-2" />
            <input type="number" value={form.base_amount} onChange={(e) => setForm((p) => ({ ...p, base_amount: Number(e.target.value || 0) }))} placeholder="Trước thuế" className="border border-slate-200 rounded-lg px-3 py-2" />
            <input type="number" value={form.tax_rate} onChange={(e) => setForm((p) => ({ ...p, tax_rate: Number(e.target.value || 0) }))} placeholder="VAT %" className="border border-slate-200 rounded-lg px-3 py-2" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Diễn giải" className="border border-slate-200 rounded-lg px-3 py-2 min-h-[100px]" />
        </div>
      </Modal>

      <Modal title={`Thanh toán ${paymentTarget?.code || ""}`} open={!!paymentTarget} onCancel={() => setPaymentTarget(null)} onOk={() => paymentTarget && actionMutation.mutate({ type: "payment", row: paymentTarget, amount: paymentAmount })}>
        <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value || 0))} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
      </Modal>
    </div>
  );
}

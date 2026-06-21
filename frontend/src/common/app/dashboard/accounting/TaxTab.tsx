import React, { useState } from "react";
import { Modal, notification } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useUser } from "../../../common/hooks/useUser";
import { AccountingErpService } from "../../../services/accounting-erp.service";
import { SummaryCard, formatMoney } from "./shared";

export default function TaxTab() {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", rate: 10, direction: "both" });

  const params = {
    lead: userLeadId,
    from_date: dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"),
    to_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
  };

  const taxCodeQuery = useQuery({
    queryKey: ["tax-codes", userLeadId],
    enabled: !!userLeadId,
    queryFn: async () => ((await AccountingErpService.listTaxCodes({ lead: userLeadId })).data?.data || []) as any[],
  });

  const vatQuery = useQuery({
    queryKey: ["vat-report", params],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.getVatReport(params)).data,
  });

  const mutation = useMutation({
    mutationFn: () => AccountingErpService.createTaxCode({ ...form, lead_id: userLeadId }),
    onSuccess: async () => {
      notification.success({ message: "Đã tạo mã thuế" });
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["tax-codes"] });
    },
  });

  const summary = vatQuery.data?.summary || {};

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard label="VAT đầu vào" value={`${formatMoney(summary.vat_input || 0)} đ`} tone="emerald" />
        <SummaryCard label="VAT đầu ra" value={`${formatMoney(summary.vat_output || 0)} đ`} tone="teal" />
        <SummaryCard label="VAT phải nộp" value={`${formatMoney(summary.net_vat_payable || 0)} đ`} tone="amber" />
        <SummaryCard label="Kỳ" value={month} />
      </div>
      <div className="flex flex-wrap gap-3">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2" />
        <button className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>
          + Mã thuế
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-slate-500 border-b bg-slate-50"><th className="px-3 py-3">Code</th><th className="px-3 py-3">Tên</th><th className="px-3 py-3">Rate</th><th className="px-3 py-3">Direction</th></tr></thead>
          <tbody>{(taxCodeQuery.data || []).map((row: any) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.code}</td><td className="px-3 py-3">{row.name}</td><td className="px-3 py-3">{row.rate}%</td><td className="px-3 py-3">{row.direction}</td></tr>)}</tbody>
        </table>
      </div>

      <Modal title="Tạo mã thuế" open={open} onCancel={() => setOpen(false)} onOk={() => mutation.mutate()}>
        <div className="grid grid-cols-1 gap-2 pt-2">
          <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" className="border border-slate-200 rounded-lg px-3 py-2" />
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tên" className="border border-slate-200 rounded-lg px-3 py-2" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: Number(e.target.value || 0) }))} className="border border-slate-200 rounded-lg px-3 py-2" />
            <select value={form.direction} onChange={(e) => setForm((p) => ({ ...p, direction: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
              <option value="both">both</option>
              <option value="input">input</option>
              <option value="output">output</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

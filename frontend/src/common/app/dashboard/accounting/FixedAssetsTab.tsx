import React, { useState } from "react";
import { Modal, notification } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useUser } from "../../../common/hooks/useUser";
import { AccountingErpService, type FixedAsset } from "../../../services/accounting-erp.service";
import { SummaryCard, StatusBadge, formatMoney } from "./shared";

const emptyForm = {
  name: "",
  purchase_date: dayjs().format("YYYY-MM-DD"),
  cost: 0,
  salvage_value: 0,
  useful_life_months: 36,
  department: "Văn phòng",
};

export default function FixedAssetsTab() {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const listQuery = useQuery({
    queryKey: ["fixed-assets", userLeadId],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.listFixedAssets({ lead: userLeadId })).data,
  });

  const createMutation = useMutation({
    mutationFn: () => AccountingErpService.createFixedAsset({ ...form, lead_id: userLeadId }),
    onSuccess: async () => {
      notification.success({ message: "Đã tạo tài sản cố định" });
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
    },
  });

  const depreciationMutation = useMutation({
    mutationFn: () => AccountingErpService.runDepreciation({ lead_id: userLeadId, period_key: month }),
    onSuccess: async (res) => {
      notification.success({ message: `Đã chạy khấu hao ${res.data?.count || 0} tài sản` });
      await queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
    },
    onError: (error: any) => notification.error({ message: error?.response?.data?.description || "Chạy khấu hao thất bại" }),
  });

  const rows = (listQuery.data?.data || []) as FixedAsset[];
  const totalCost = rows.reduce((sum, row) => sum + Number(row.cost || 0), 0);
  const totalAccum = rows.reduce((sum, row) => sum + Number(row.accumulated_depreciation || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard label="Nguyên giá" value={`${formatMoney(totalCost)} đ`} tone="teal" />
        <SummaryCard label="Hao mòn lũy kế" value={`${formatMoney(totalAccum)} đ`} tone="amber" />
        <SummaryCard label="Giá trị còn lại" value={`${formatMoney(totalCost - totalAccum)} đ`} tone="emerald" />
      </div>
      <div className="flex flex-wrap gap-3">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2" />
        <button className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>+ TSCĐ</button>
        <button className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => depreciationMutation.mutate()}>Chạy khấu hao tháng</button>
      </div>
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-slate-500 border-b bg-slate-50"><th className="px-3 py-3">Mã</th><th className="px-3 py-3">Tên</th><th className="px-3 py-3">Ngày mua</th><th className="px-3 py-3">Nguyên giá</th><th className="px-3 py-3">Khấu hao/tháng</th><th className="px-3 py-3">Lũy kế</th><th className="px-3 py-3">Bộ phận</th><th className="px-3 py-3">Trạng thái</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.code}</td><td className="px-3 py-3">{row.name}</td><td className="px-3 py-3">{dayjs(row.purchase_date).format("DD/MM/YYYY")}</td><td className="px-3 py-3">{formatMoney(row.cost)} đ</td><td className="px-3 py-3">{formatMoney(row.monthly_depreciation)} đ</td><td className="px-3 py-3">{formatMoney(row.accumulated_depreciation)} đ</td><td className="px-3 py-3">{row.department || "-"}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td></tr>)}</tbody>
        </table>
      </div>
      <Modal title="Tạo tài sản cố định" open={open} onCancel={() => setOpen(false)} onOk={() => createMutation.mutate()}>
        <div className="grid grid-cols-1 gap-2 pt-2">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tên tài sản" className="border border-slate-200 rounded-lg px-3 py-2" />
          <input type="date" value={form.purchase_date} onChange={(e) => setForm((p) => ({ ...p, purchase_date: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2" />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: Number(e.target.value || 0) }))} placeholder="Nguyên giá" className="border border-slate-200 rounded-lg px-3 py-2" />
            <input type="number" value={form.salvage_value} onChange={(e) => setForm((p) => ({ ...p, salvage_value: Number(e.target.value || 0) }))} placeholder="Giá trị thu hồi" className="border border-slate-200 rounded-lg px-3 py-2" />
            <input type="number" value={form.useful_life_months} onChange={(e) => setForm((p) => ({ ...p, useful_life_months: Number(e.target.value || 0) }))} placeholder="Tháng KH" className="border border-slate-200 rounded-lg px-3 py-2" />
          </div>
          <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="Bộ phận sử dụng" className="border border-slate-200 rounded-lg px-3 py-2" />
        </div>
      </Modal>
    </div>
  );
}

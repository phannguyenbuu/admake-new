import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useUser } from "../../../common/hooks/useUser";
import { AccountingErpService } from "../../../services/accounting-erp.service";
import { SummaryCard, formatMoney } from "./shared";

export default function ReportsTab() {
  const { userLeadId } = useUser();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const params = {
    lead: userLeadId,
    from_date: dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"),
    to_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
  };

  const pnlQuery = useQuery({ queryKey: ["report-pnl", params], enabled: !!userLeadId, queryFn: async () => (await AccountingErpService.getProfitLoss(params)).data });
  const bsQuery = useQuery({ queryKey: ["report-bs", userLeadId, month], enabled: !!userLeadId, queryFn: async () => (await AccountingErpService.getBalanceSheet({ lead: userLeadId, to_date: params.to_date })).data });
  const cfQuery = useQuery({ queryKey: ["report-cf", params], enabled: !!userLeadId, queryFn: async () => (await AccountingErpService.getCashflow(params)).data });

  const pnlRows = pnlQuery.data?.data || [];
  const bsRows = bsQuery.data?.data || [];
  const cashflow = cfQuery.data?.summary || {};

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard label="Dòng tiền vào" value={`${formatMoney(cashflow.income || 0)} đ`} tone="emerald" />
        <SummaryCard label="Dòng tiền ra" value={`${formatMoney(cashflow.expense || 0)} đ`} tone="rose" />
        <SummaryCard label="Dòng tiền thuần" value={`${formatMoney(cashflow.net || 0)} đ`} tone="teal" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">Kết quả kinh doanh</div>
          <div className="flex flex-col gap-2">
            {pnlRows.map((row: any) => (
              <div key={row.label} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2 text-sm">
                <span>{row.label}</span>
                <b>{formatMoney(row.amount)} đ</b>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">Bảng cân đối kế toán</div>
          <div className="flex flex-col gap-2">
            {bsRows.map((row: any) => (
              <div key={row.label} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2 text-sm">
                <span>{row.label}</span>
                <b>{formatMoney(row.amount)} đ</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

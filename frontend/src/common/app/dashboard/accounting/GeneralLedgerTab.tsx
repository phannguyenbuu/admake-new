import React, { useState } from "react";
import { Modal, notification } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useUser } from "../../../common/hooks/useUser";
import { AccountingErpService, type ChartOfAccount, type JournalEntry } from "../../../services/accounting-erp.service";
import { StatusBadge, formatMoney } from "./shared";

export default function GeneralLedgerTab() {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"accounts" | "journal" | "trial" | "ledger">("accounts");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [accountCode, setAccountCode] = useState("111");
  const [open, setOpen] = useState(false);
  const [manualLines, setManualLines] = useState([
    { account_code: "111", debit: 0, credit: 0 },
    { account_code: "131", debit: 0, credit: 0 },
  ]);

  const commonParams = {
    lead: userLeadId,
    from_date: dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"),
    to_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
  };

  const accountsQuery = useQuery({
    queryKey: ["gl-accounts", userLeadId],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.listAccounts({ lead: userLeadId })).data,
  });
  const journalQuery = useQuery({
    queryKey: ["gl-journal", commonParams],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.listJournalEntries(commonParams)).data,
  });
  const trialQuery = useQuery({
    queryKey: ["gl-trial", commonParams],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.getTrialBalance(commonParams)).data,
  });
  const ledgerQuery = useQuery({
    queryKey: ["gl-ledger", commonParams, accountCode],
    enabled: !!userLeadId && !!accountCode,
    queryFn: async () => (await AccountingErpService.getLedger({ ...commonParams, account_code: accountCode })).data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      AccountingErpService.createJournalEntry({
        lead_id: userLeadId,
        entry_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
        description: "Bút toán tay",
        lines: manualLines,
      }),
    onSuccess: async () => {
      notification.success({ message: "Đã tạo bút toán tay" });
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["gl-journal"] });
    },
    onError: (error: any) => notification.error({ message: error?.response?.data?.description || "Tạo bút toán thất bại" }),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => AccountingErpService.postJournalEntry(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gl-journal"] });
      await queryClient.invalidateQueries({ queryKey: ["gl-trial"] });
      await queryClient.invalidateQueries({ queryKey: ["gl-ledger"] });
    },
  });

  const accounts = (accountsQuery.data?.data || []) as ChartOfAccount[];
  const journals = (journalQuery.data?.data || []) as JournalEntry[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          ["accounts", "Danh mục tài khoản"],
          ["journal", "Nhật ký chung"],
          ["trial", "Cân đối phát sinh"],
          ["ledger", "Sổ cái"],
        ].map(([key, label]) => (
          <button key={key} className={`px-3 py-2 text-sm rounded-lg ${subTab === key ? "bg-teal-50 text-teal-700" : "text-slate-600"}`} onClick={() => setSubTab(key as any)}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2" />
        {subTab === "ledger" && (
          <select value={accountCode} onChange={(e) => setAccountCode(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
            {accounts.map((item) => (
              <option key={item.id} value={item.code}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
        )}
        {subTab === "journal" && (
          <button className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>
            + Bút toán tay
          </button>
        )}
      </div>

      {subTab === "accounts" && (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-500 border-b bg-slate-50"><th className="px-3 py-3">Mã</th><th className="px-3 py-3">Tên</th><th className="px-3 py-3">Loại</th><th className="px-3 py-3">Trạng thái</th></tr></thead>
            <tbody>{accounts.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.code}</td><td className="px-3 py-3">{row.name}</td><td className="px-3 py-3">{row.account_type}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td></tr>)}</tbody>
          </table>
        </div>
      )}

      {subTab === "journal" && (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-500 border-b bg-slate-50"><th className="px-3 py-3">Số CT</th><th className="px-3 py-3">Ngày</th><th className="px-3 py-3">Diễn giải</th><th className="px-3 py-3">Nguồn</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Hành động</th></tr></thead>
            <tbody>
              {journals.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-3 font-medium">{row.entry_no}</td>
                  <td className="px-3 py-3">{dayjs(row.entry_date).format("DD/MM/YYYY")}</td>
                  <td className="px-3 py-3">{row.description || "-"}</td>
                  <td className="px-3 py-3">{row.source_type || "-"}</td>
                  <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-3 py-3">{row.status === "draft" && <button className="px-2 py-1 text-xs border rounded-md" onClick={() => postMutation.mutate(row.id)}>Post</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "trial" && (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-500 border-b bg-slate-50"><th className="px-3 py-3">TK</th><th className="px-3 py-3">Tên</th><th className="px-3 py-3">Nợ</th><th className="px-3 py-3">Có</th><th className="px-3 py-3">Số dư</th></tr></thead>
            <tbody>{(trialQuery.data?.data || []).map((row: any) => <tr key={row.account_code} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{row.account_code}</td><td className="px-3 py-3">{row.account_name}</td><td className="px-3 py-3">{formatMoney(row.debit)} đ</td><td className="px-3 py-3">{formatMoney(row.credit)} đ</td><td className="px-3 py-3">{formatMoney(row.balance)} đ</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {subTab === "ledger" && (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-500 border-b bg-slate-50"><th className="px-3 py-3">Ngày</th><th className="px-3 py-3">Số CT</th><th className="px-3 py-3">Diễn giải</th><th className="px-3 py-3">Nợ</th><th className="px-3 py-3">Có</th><th className="px-3 py-3">Số dư</th></tr></thead>
            <tbody>{(ledgerQuery.data?.data || []).map((row: any) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3">{dayjs(row.entry_date).format("DD/MM/YYYY")}</td><td className="px-3 py-3">{row.entry_no}</td><td className="px-3 py-3">{row.description || "-"}</td><td className="px-3 py-3">{formatMoney(row.debit)} đ</td><td className="px-3 py-3">{formatMoney(row.credit)} đ</td><td className="px-3 py-3">{formatMoney(row.running_balance)} đ</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <Modal title="Tạo bút toán tay" open={open} onCancel={() => setOpen(false)} onOk={() => createMutation.mutate()}>
        <div className="grid grid-cols-1 gap-2 pt-2">
          {manualLines.map((line, index) => (
            <div key={index} className="grid grid-cols-3 gap-2">
              <input value={line.account_code} onChange={(e) => setManualLines((prev) => prev.map((item, idx) => idx === index ? { ...item, account_code: e.target.value } : item))} className="border border-slate-200 rounded-lg px-3 py-2" />
              <input type="number" value={line.debit} onChange={(e) => setManualLines((prev) => prev.map((item, idx) => idx === index ? { ...item, debit: Number(e.target.value || 0) } : item))} className="border border-slate-200 rounded-lg px-3 py-2" />
              <input type="number" value={line.credit} onChange={(e) => setManualLines((prev) => prev.map((item, idx) => idx === index ? { ...item, credit: Number(e.target.value || 0) } : item))} className="border border-slate-200 rounded-lg px-3 py-2" />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

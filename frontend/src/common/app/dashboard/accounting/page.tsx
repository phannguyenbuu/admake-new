import type { IPage } from "../../../@types/common.type";
import React, { useState } from "react";
import PayrollSummaryTab from "./PayrollSummaryTab";
import DailyCashTab from "./DailyCashTab";
import AccountingDocumentsTab from "./AccountingDocumentsTab";
import DocumentCenterTab from "./DocumentCenterTab";
import AccountsReceivableTab from "./AccountsReceivableTab";
import AccountsPayableTab from "./AccountsPayableTab";
import GeneralLedgerTab from "./GeneralLedgerTab";
import TaxTab from "./TaxTab";
import FixedAssetsTab from "./FixedAssetsTab";
import ReportsTab from "./ReportsTab";
import RecordsTab from "./RecordsTab";

const tabs = [
  { key: "bang-luong", label: "Bảng lương nhân sự" },
  { key: "thu-chi", label: "Thu chi hàng ngày" },
  { key: "ar", label: "Công nợ phải thu" },
  { key: "ap", label: "Công nợ phải trả" },
  { key: "chung-tu", label: "Sổ chứng từ kế toán" },
  { key: "so-ke-toan", label: "Sổ kế toán" },
  { key: "thue", label: "Thuế" },
  { key: "tscd", label: "Tài sản cố định" },
  { key: "ho-so", label: "Hồ sơ" },
  { key: "bao-cao", label: "Báo cáo" },
  { key: "document-center", label: "Trung tâm chứng từ" },
];

const AccountingDashboard: IPage["Component"] = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label || tabs[0].label;

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <section className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-md">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-teal-600">Kế toán</h2>
            <div className="text-sm text-slate-500">Module kế toán</div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[280px]">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Danh mục
            </label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 border-b border-slate-200 pb-3">
          <div className="text-sm font-semibold text-slate-700">{activeTabLabel}</div>
        </div>

        {activeTab === "bang-luong" && <PayrollSummaryTab />}
        {activeTab === "thu-chi" && <DailyCashTab />}
        {activeTab === "ar" && <AccountsReceivableTab />}
        {activeTab === "ap" && <AccountsPayableTab />}
        {activeTab === "chung-tu" && <AccountingDocumentsTab />}
        {activeTab === "so-ke-toan" && <GeneralLedgerTab />}
        {activeTab === "thue" && <TaxTab />}
        {activeTab === "tscd" && <FixedAssetsTab />}
        {activeTab === "bao-cao" && <ReportsTab />}
        {activeTab === "ho-so" && <RecordsTab />}
        {activeTab === "document-center" && <DocumentCenterTab />}
      </section>
    </div>
  );
};

export default AccountingDashboard;

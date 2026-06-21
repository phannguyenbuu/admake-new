import type { IPage } from "../../../@types/common.type";
import type { DashboardPermissionKey } from "../../../@types/user-can-view.type";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "../../../common/hooks/useUser";
import UnPermissionBoard from "../unPermissionBoard";
import PayrollSummaryTab from "./PayrollSummaryTab";
import DailyCashTab from "./DailyCashTab";
import AccountingDocumentsTab from "./AccountingDocumentsTab";
import AccountsReceivableTab from "./AccountsReceivableTab";
import AccountsPayableTab from "./AccountsPayableTab";
import GeneralLedgerTab from "./GeneralLedgerTab";
import TaxTab from "./TaxTab";
import FixedAssetsTab from "./FixedAssetsTab";
import ReportsTab from "./ReportsTab";
import RecordsTab from "./RecordsTab";

type AccountingTab = {
  key: string;
  label: string;
  permission: DashboardPermissionKey;
  render: () => React.ReactNode;
};

const tabs: AccountingTab[] = [
  { key: "bang-luong", label: "Bảng lương nhân sự", permission: "view_acc_payroll", render: () => <PayrollSummaryTab /> },
  { key: "thu-chi", label: "Thu chi hàng ngày", permission: "view_acc_cashflow", render: () => <DailyCashTab /> },
  { key: "ar", label: "Công nợ phải thu", permission: "view_acc_ar", render: () => <AccountsReceivableTab /> },
  { key: "ap", label: "Công nợ phải trả", permission: "view_acc_ap", render: () => <AccountsPayableTab /> },
  { key: "chung-tu", label: "Sổ chứng từ kế toán", permission: "view_acc_docs", render: () => <AccountingDocumentsTab /> },
  { key: "so-ke-toan", label: "Sổ kế toán", permission: "view_acc_ledger", render: () => <GeneralLedgerTab /> },
  { key: "thue", label: "Thuế", permission: "view_acc_tax", render: () => <TaxTab /> },
  { key: "tscd", label: "Tài sản cố định", permission: "view_acc_assets", render: () => <FixedAssetsTab /> },
  { key: "ho-so", label: "Hồ sơ", permission: "view_acc_records", render: () => <RecordsTab /> },
  { key: "bao-cao", label: "Báo cáo", permission: "view_acc_reports", render: () => <ReportsTab /> },
];

const AccountingDashboard: IPage["Component"] = () => {
  const { canViewPermission, userRoleId } = useUser();
  const [activeTab, setActiveTab] = useState("");
  const [isTabbarExpanded, setIsTabbarExpanded] = useState(false);

  const availableTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (tab.key === "bao-cao") {
          return userRoleId === -2 || userRoleId === 1 || Boolean(canViewPermission?.view_acc_reports);
        }
        return Boolean(canViewPermission?.[tab.permission]);
      }),
    [canViewPermission, userRoleId],
  );

  useEffect(() => {
    if (!availableTabs.length) return;

    if (!availableTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(availableTabs[0].key);
    }
  }, [activeTab, availableTabs]);

  if (!canViewPermission?.view_accountant) {
    return <UnPermissionBoard />;
  }

  if (availableTabs.length === 0) {
    return <UnPermissionBoard />;
  }

  const activeTabConfig =
    availableTabs.find((tab) => tab.key === activeTab) || availableTabs[0];
  const activeTabLabel = activeTabConfig.label;
  const activeTabIndex = Math.max(
    0,
    availableTabs.findIndex((tab) => tab.key === activeTabConfig.key),
  );

  const shiftTab = (direction: -1 | 1) => {
    const nextIndex =
      (activeTabIndex + direction + availableTabs.length) % availableTabs.length;
    setActiveTab(availableTabs[nextIndex].key);
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <section className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-md">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-teal-600">Kế toán</h2>
            <div className="text-sm text-slate-500">Module kế toán</div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[420px]">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Danh mục
            </label>

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftTab(-1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600"
                  title="Tab trước"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsTabbarExpanded((current) => !current)}
                  className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  title={isTabbarExpanded ? "Thu gọn tab" : "Mở rộng tab"}
                >
                  {activeTabLabel}
                </button>

                <button
                  type="button"
                  onClick={() => shiftTab(1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600"
                  title="Tab tiếp"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {isTabbarExpanded && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.key);
                        setIsTabbarExpanded(false);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        activeTabConfig.key === tab.key
                          ? "border-teal-500 bg-teal-500 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-600"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4 border-b border-slate-200 pb-3">
          <div className="text-sm font-semibold text-slate-700">{activeTabLabel}</div>
        </div>

        {activeTabConfig.render()}
      </section>
    </div>
  );
};

export default AccountingDashboard;

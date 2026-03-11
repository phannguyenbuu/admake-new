import axiosClient from "./axiosClient";

export type ArInvoice = {
  id: string;
  code: string;
  customer_id?: string | null;
  customer_name: string;
  invoice_date: string;
  due_date?: string | null;
  base_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  currency?: string;
  status: string;
  description?: string | null;
};

export type ApBill = {
  id: string;
  code: string;
  supplier_id?: string | null;
  supplier_name: string;
  bill_date: string;
  due_date?: string | null;
  expense_account_code: string;
  base_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  currency?: string;
  status: string;
  description?: string | null;
};

export type JournalEntry = {
  id: string;
  entry_no: string;
  entry_date: string;
  description?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  reference_no?: string | null;
  status: string;
};

export type ChartOfAccount = {
  id: string;
  code: string;
  name: string;
  account_type: string;
  parent_code?: string | null;
  allow_posting: boolean;
  status: string;
};

export type TaxCode = {
  id: string;
  code: string;
  name: string;
  rate: number;
  direction: string;
  status: string;
  is_default: boolean;
};

export type FixedAsset = {
  id: string;
  code: string;
  name: string;
  purchase_date: string;
  capitalized_date?: string | null;
  cost: number;
  salvage_value: number;
  useful_life_months: number;
  monthly_depreciation: number;
  accumulated_depreciation: number;
  department?: string | null;
  asset_account_code: string;
  accumulated_account_code: string;
  expense_account_code: string;
  status: string;
};

export const AccountingErpService = {
  bootstrap: (lead_id: number) => axiosClient.post("/accounting/setup/bootstrap", { lead_id }),

  listArInvoices: (params: Record<string, any>) => axiosClient.get("/accounting/ar-invoices", { params }),
  createArInvoice: (payload: Record<string, any>) => axiosClient.post("/accounting/ar-invoices", payload),
  getArInvoice: (id: string) => axiosClient.get(`/accounting/ar-invoices/${id}`),
  updateArInvoice: (id: string, payload: Record<string, any>) => axiosClient.put(`/accounting/ar-invoices/${id}`, payload),
  confirmArInvoice: (id: string) => axiosClient.post(`/accounting/ar-invoices/${id}/confirm`, {}),
  cancelArInvoice: (id: string) => axiosClient.post(`/accounting/ar-invoices/${id}/cancel`, {}),
  recordArPayment: (id: string, payload: Record<string, any>) => axiosClient.post(`/accounting/ar-invoices/${id}/payments`, payload),
  getArAging: (params: Record<string, any>) => axiosClient.get("/accounting/ar-aging", { params }),

  listApBills: (params: Record<string, any>) => axiosClient.get("/accounting/ap-bills", { params }),
  createApBill: (payload: Record<string, any>) => axiosClient.post("/accounting/ap-bills", payload),
  getApBill: (id: string) => axiosClient.get(`/accounting/ap-bills/${id}`),
  updateApBill: (id: string, payload: Record<string, any>) => axiosClient.put(`/accounting/ap-bills/${id}`, payload),
  confirmApBill: (id: string) => axiosClient.post(`/accounting/ap-bills/${id}/confirm`, {}),
  cancelApBill: (id: string) => axiosClient.post(`/accounting/ap-bills/${id}/cancel`, {}),
  recordApPayment: (id: string, payload: Record<string, any>) => axiosClient.post(`/accounting/ap-bills/${id}/payments`, payload),
  getApAging: (params: Record<string, any>) => axiosClient.get("/accounting/ap-aging", { params }),

  listAccounts: (params: Record<string, any>) => axiosClient.get("/accounting/accounts", { params }),
  createAccount: (payload: Record<string, any>) => axiosClient.post("/accounting/accounts", payload),
  updateAccount: (id: string, payload: Record<string, any>) => axiosClient.put(`/accounting/accounts/${id}`, payload),

  listTaxCodes: (params: Record<string, any>) => axiosClient.get("/accounting/tax-codes", { params }),
  createTaxCode: (payload: Record<string, any>) => axiosClient.post("/accounting/tax-codes", payload),

  listJournalEntries: (params: Record<string, any>) => axiosClient.get("/accounting/journal-entries", { params }),
  createJournalEntry: (payload: Record<string, any>) => axiosClient.post("/accounting/journal-entries", payload),
  getJournalEntry: (id: string) => axiosClient.get(`/accounting/journal-entries/${id}`),
  postJournalEntry: (id: string) => axiosClient.post(`/accounting/journal-entries/${id}/post`, {}),
  reverseJournalEntry: (id: string, reason?: string) => axiosClient.post(`/accounting/journal-entries/${id}/reverse`, { reason }),
  getLedger: (params: Record<string, any>) => axiosClient.get("/accounting/ledger", { params }),
  getTrialBalance: (params: Record<string, any>) => axiosClient.get("/accounting/trial-balance", { params }),

  getVatReport: (params: Record<string, any>) => axiosClient.get("/accounting/vat-report", { params }),
  listFixedAssets: (params: Record<string, any>) => axiosClient.get("/accounting/fixed-assets", { params }),
  createFixedAsset: (payload: Record<string, any>) => axiosClient.post("/accounting/fixed-assets", payload),
  runDepreciation: (payload: Record<string, any>) => axiosClient.post("/accounting/fixed-assets/run-depreciation", payload),
  getAssetDepreciations: (id: string) => axiosClient.get(`/accounting/fixed-assets/${id}/depreciations`),

  getProfitLoss: (params: Record<string, any>) => axiosClient.get("/accounting/reports/profit-loss", { params }),
  getBalanceSheet: (params: Record<string, any>) => axiosClient.get("/accounting/reports/balance-sheet", { params }),
  getCashflow: (params: Record<string, any>) => axiosClient.get("/accounting/reports/cashflow", { params }),
  trace: (params: Record<string, any>) => axiosClient.get("/accounting/trace", { params }),
};

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
  effective_total_amount?: number;
  paid_amount: number;
  balance_amount: number;
  currency?: string;
  status: string;
  description?: string | null;
  payments?: ArInvoicePayment[];
  phat_sinh_amount?: number; // từ list endpoint: tổng phát sinh
  tam_ung_amount?: number;   // từ list endpoint: tổng tạm ứng
};

export type ArInvoicePayment = {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_type: string; // "tam_ung" | "phat_sinh"
  note?: string | null;
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
  phat_sinh_amount?: number;
  tam_ung_amount?: number;
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
  quantity?: number;
  department?: string | null;
  asset_account_code: string;
  accumulated_account_code: string;
  expense_account_code: string;
  status: string;
  events?: FixedAssetEvent[];
};

export type FixedAssetEvent = {
  id: string;
  asset_id: string;
  event_type: "purchase" | "maintenance" | "responsible" | string;
  event_date?: string | null;
  person_name?: string | null;
  person_phone?: string | null;
  note?: string | null;
};

export type AssetPerson = {
  id: string;
  name: string;
  phone: string;
  user_type: "employee" | "subcontractor" | string;
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
  updateArPayment: (invoiceId: string, paymentId: string, payload: Record<string, any>) => axiosClient.patch(`/accounting/ar-invoices/${invoiceId}/payments/${paymentId}`, payload),
  deleteArPayment: (invoiceId: string, paymentId: string) => axiosClient.delete(`/accounting/ar-invoices/${invoiceId}/payments/${paymentId}`),
  listTasksForAccounting: (lead: number) => axiosClient.get("/accounting/tasks", { params: { lead } }),
  getArAging: (params: Record<string, any>) => axiosClient.get("/accounting/ar-aging", { params }),



  listApBills: (params: Record<string, any>) => axiosClient.get("/accounting/ap-bills", { params }),
  createApBill: (payload: Record<string, any>) => axiosClient.post("/accounting/ap-bills", payload),
  getApBill: (id: string) => axiosClient.get(`/accounting/ap-bills/${id}`),
  updateApBill: (id: string, payload: Record<string, any>) => axiosClient.put(`/accounting/ap-bills/${id}`, payload),
  confirmApBill: (id: string) => axiosClient.post(`/accounting/ap-bills/${id}/confirm`, {}),
  cancelApBill: (id: string) => axiosClient.post(`/accounting/ap-bills/${id}/cancel`, {}),
  recordApPayment: (id: string, payload: Record<string, any>) => axiosClient.post(`/accounting/ap-bills/${id}/payments`, payload),
  updateApPayment: (billId: string, paymentId: string, payload: Record<string, any>) => axiosClient.patch(`/accounting/ap-bills/${billId}/payments/${paymentId}`, payload),
  deleteApPayment: (billId: string, paymentId: string) => axiosClient.delete(`/accounting/ap-bills/${billId}/payments/${paymentId}`),
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
  updateFixedAsset: (id: string, payload: Record<string, any>) => axiosClient.patch(`/accounting/fixed-assets/${id}`, payload),
  deleteFixedAsset: (id: string) => axiosClient.delete(`/accounting/fixed-assets/${id}`),
  runDepreciation: (payload: Record<string, any>) => axiosClient.post("/accounting/fixed-assets/run-depreciation", payload),
  getAssetDepreciations: (id: string) => axiosClient.get(`/accounting/fixed-assets/${id}/depreciations`),
  listAssetEvents: (assetId: string) => axiosClient.get(`/accounting/fixed-assets/${assetId}/events`),
  createAssetEvent: (assetId: string, payload: Record<string, any>) => axiosClient.post(`/accounting/fixed-assets/${assetId}/events`, payload),
  updateAssetEvent: (assetId: string, eventId: string, payload: Record<string, any>) => axiosClient.patch(`/accounting/fixed-assets/${assetId}/events/${eventId}`, payload),
  deleteAssetEvent: (assetId: string, eventId: string) => axiosClient.delete(`/accounting/fixed-assets/${assetId}/events/${eventId}`),
  listPeopleForAsset: (lead: number) => axiosClient.get("/accounting/people-list", { params: { lead } }),

  getProfitLoss: (params: Record<string, any>) => axiosClient.get("/accounting/reports/profit-loss", { params }),
  getBalanceSheet: (params: Record<string, any>) => axiosClient.get("/accounting/reports/balance-sheet", { params }),
  getCashflow: (params: Record<string, any>) => axiosClient.get("/accounting/reports/cashflow", { params }),
  trace: (params: Record<string, any>) => axiosClient.get("/accounting/trace", { params }),

  // ─── Hồ sơ kế toán ───────────────────────────────────────────────────────
  listRecords: (lead: number, sub_tab?: string) =>
    axiosClient.get("/accounting/records", { params: { lead, ...(sub_tab ? { sub_tab } : {}) } }),
  createRecord: (payload: Record<string, any>) => axiosClient.post("/accounting/records", payload),
  updateRecord: (id: string, payload: Record<string, any>) => axiosClient.put(`/accounting/records/${id}`, payload),
  deleteRecord: (id: string) => axiosClient.delete(`/accounting/records/${id}`),
  /** Upload file .doc / .docx → server convert → trả về HTML */
  convertDoc: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return axiosClient.post<{ html: string; error?: string }>(
      "/accounting/records/convert-doc",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
};


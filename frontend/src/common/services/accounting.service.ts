import axiosClient from "./axiosClient";

export type DailyCashRow = {
  id: string;
  lead_id: number;
  user_id?: string | null;
  user_name?: string;
  txn_date: string;
  voucher_no?: string;
  direction: "income" | "expense";
  amount: number;
  description?: string;
  counterparty_name?: string;
  material_name?: string;
  unit?: string;
  quantity?: number;
  status?: string;
  payment_method?: string;
  doc_ref?: string;
  note?: string;
  attachments?: { filename?: string; file_url?: string; thumb_url?: string }[];
};

export type AccountingDocumentRow = {
  id: string;
  lead_id: number;
  doc_no?: string;
  doc_type: string;
  doc_date: string;
  signed_date?: string | null;
  due_date?: string | null;
  partner_name?: string;
  project_name?: string;
  material_name?: string;
  amount?: number;
  subtotal_amount?: number;
  tax_amount?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  currency?: string;
  content?: string;
  attachments?: { filename?: string; file_url?: string; thumb_url?: string }[];
  tags?: string[];
};

export type AccountingMetadata = {
  document_types: string[];
  document_status: string[];
  payment_status: string[];
  payment_methods: string[];
  cash_directions: string[];
  cash_status: string[];
};

export type PayrollRow = {
  user_id: string;
  full_name: string;
  phone: string;
  department: string;
  group_type: "staff" | "supplier";
  bank_account?: string;
  salary_base: number;
  period_work: number;
  work_hours: number;
  overtime_hours: number;
  salary_base_total: number;
  salary_overtime_total: number;
  bonus_total: number;
  punish_total: number;
  advance_total: number;
  allowance?: number;   // Phụ cấp (+)
  bhyt?: number;        // BHYT (-)
  bhxh?: number;        // BHXH (-)
  carry_forward?: number; // Mang sang (+)
  net_salary: number;
};

export type PayrollAdjustmentType = "bonus" | "punish" | "advance" | "commission" | "allowance" | "bhyt" | "bhxh" | "carry_forward";

export type PayrollAdjustmentRow = {
  id: string;
  lead_id: number;
  user_id: string;
  type: PayrollAdjustmentType;
  note?: string | null;
  amount: number;
  entry_date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PayrollSummary = {
  from_month: string;
  to_month: string;
  total_people: number;
  total_staff: number;
  total_supplier: number;
  total_base_salary: number;
  total_overtime_salary: number;
  total_bonus: number;
  total_punish: number;
  total_advance: number;
  total_allowance?: number;
  total_bhyt?: number;
  total_bhxh?: number;
  total_carry_forward?: number;
  total_net_salary: number;
};

export type PayrollGroupSummary = {
  total_people: number;
  total_base_salary: number;
  total_overtime_salary: number;
  total_bonus: number;
  total_punish: number;
  total_advance: number;
  total_allowance?: number;
  total_bhyt?: number;
  total_bhxh?: number;
  total_carry_forward?: number;
  total_net_salary: number;
};

export type PayrollSummaryResponse = {
  rows?: PayrollRow[];
  staff_rows?: PayrollRow[];
  supplier_rows?: PayrollRow[];
  summary?: PayrollSummary;
  staff_summary?: PayrollGroupSummary;
  supplier_summary?: PayrollGroupSummary;
  adjustments?: PayrollAdjustmentRow[];
};

export const AccountingService = {
  getPayrollSummary: (params: Record<string, any>) =>
    axiosClient.get<PayrollSummaryResponse>("/workpoint/payroll-summary", { params }),
  getPayrollAdjustments: (params: Record<string, any>) =>
    axiosClient.get<{ rows: PayrollAdjustmentRow[] }>("/workpoint/payroll-adjustments", { params }),
  createPayrollAdjustment: (payload: Partial<PayrollAdjustmentRow> & { lead_id: number; user_id: string; type: PayrollAdjustmentType; amount: number; entry_date: string }) =>
    axiosClient.post<PayrollAdjustmentRow>("/workpoint/payroll-adjustments", payload),
  updatePayrollAdjustment: (id: string, payload: Partial<PayrollAdjustmentRow>) =>
    axiosClient.put<PayrollAdjustmentRow>(`/workpoint/payroll-adjustments/${id}`, payload),
  deletePayrollAdjustment: (id: string) =>
    axiosClient.delete<{ success: boolean }>(`/workpoint/payroll-adjustments/${id}`),
  getDailyCash: (params: Record<string, any>) => axiosClient.get("/accounting/daily-cash", { params }),
  createDailyCash: (payload: Partial<DailyCashRow>) => axiosClient.post("/accounting/daily-cash", payload),
  updateDailyCash: (id: string, payload: Partial<DailyCashRow>) =>
    axiosClient.put(`/accounting/daily-cash/${id}`, payload),
  deleteDailyCash: (id: string) => axiosClient.delete(`/accounting/daily-cash/${id}`),

  getDocuments: (params: Record<string, any>) => axiosClient.get("/accounting/documents", { params }),
  createDocument: (payload: Partial<AccountingDocumentRow>) => axiosClient.post("/accounting/documents", payload),
  updateDocument: (id: string, payload: Partial<AccountingDocumentRow>) =>
    axiosClient.put(`/accounting/documents/${id}`, payload),
  deleteDocument: (id: string) => axiosClient.delete(`/accounting/documents/${id}`),

  getDocumentTypes: () => axiosClient.get("/accounting/document-types"),
  getMetadata: () => axiosClient.get("/accounting/metadata"),
  getMaterialSuggest: (params: Record<string, any>) =>
    axiosClient.get("/accounting/material-suggest", { params }),
  uploadAttachment: (formData: FormData) =>
    axiosClient.post("/accounting/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

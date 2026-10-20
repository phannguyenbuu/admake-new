-- 20261020_accounting_refactor_safe.sql
-- Safe refactor indexing and schema validation for Accounting & ERP
-- Principle: Zero data loss, keep existing rows intact

-- 1. Ensure composite indexes for AR and AP performance
CREATE INDEX IF NOT EXISTS ix_ar_invoices_lead_created ON ar_invoices (lead_id, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS ix_ap_bills_lead_created ON ap_bills (lead_id, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS ix_daily_cash_lead_date ON accounting_daily_cash (lead_id, txn_date DESC);
CREATE INDEX IF NOT EXISTS ix_daily_cash_doc_ref ON accounting_daily_cash (lead_id, doc_ref);

-- 2. Ensure payment references
CREATE INDEX IF NOT EXISTS ix_ar_payments_cash_id ON ar_invoice_payments (daily_cash_id);
CREATE INDEX IF NOT EXISTS ix_ap_payments_cash_id ON ap_bill_payments (daily_cash_id);

BEGIN;

ALTER TABLE accounting_daily_cash
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(40),
    ADD COLUMN IF NOT EXISTS source_id VARCHAR(80),
    ADD COLUMN IF NOT EXISTS account_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS journal_entry_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS ix_accounting_daily_cash_source
    ON accounting_daily_cash (lead_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS ix_accounting_daily_cash_account_code
    ON accounting_daily_cash (lead_id, account_code);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NULL REFERENCES lead(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(30) NOT NULL,
    parent_code VARCHAR(20),
    allow_posting BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'active',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS tax_codes (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NULL REFERENCES lead(id),
    code VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    rate DOUBLE PRECISION DEFAULT 0,
    direction VARCHAR(20) DEFAULT 'both',
    status VARCHAR(30) DEFAULT 'active',
    is_default BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS accounting_periods (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    period_key VARCHAR(7) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'open',
    closed_by VARCHAR(50),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    entry_no VARCHAR(80) NOT NULL,
    entry_date DATE NOT NULL,
    doc_date DATE,
    description TEXT,
    source_type VARCHAR(40),
    source_id VARCHAR(80),
    reference_no VARCHAR(120),
    status VARCHAR(30) DEFAULT 'draft',
    posted_at TIMESTAMP NULL,
    reversed_entry_id VARCHAR(50) NULL REFERENCES journal_entries(id),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id VARCHAR(50) PRIMARY KEY,
    journal_entry_id VARCHAR(50) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    line_no INTEGER DEFAULT 1,
    account_id VARCHAR(50) NULL REFERENCES chart_of_accounts(id),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255),
    partner_type VARCHAR(30),
    partner_id VARCHAR(80),
    partner_name VARCHAR(255),
    description VARCHAR(255),
    debit DOUBLE PRECISION DEFAULT 0,
    credit DOUBLE PRECISION DEFAULT 0,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS ar_invoices (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(80) NOT NULL,
    customer_id VARCHAR(80),
    customer_name VARCHAR(255) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    document_id VARCHAR(50) NULL REFERENCES document_center_document(id),
    tax_code_id VARCHAR(50) NULL REFERENCES tax_codes(id),
    base_amount DOUBLE PRECISION DEFAULT 0,
    tax_rate DOUBLE PRECISION DEFAULT 0,
    tax_amount DOUBLE PRECISION DEFAULT 0,
    total_amount DOUBLE PRECISION DEFAULT 0,
    paid_amount DOUBLE PRECISION DEFAULT 0,
    balance_amount DOUBLE PRECISION DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    status VARCHAR(30) DEFAULT 'draft',
    description TEXT,
    journal_entry_id VARCHAR(50) NULL REFERENCES journal_entries(id),
    confirmed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS ar_invoice_payments (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL REFERENCES ar_invoices(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    payment_date DATE NOT NULL,
    amount DOUBLE PRECISION DEFAULT 0,
    payment_method VARCHAR(30) DEFAULT 'cash',
    daily_cash_id VARCHAR(50) NULL REFERENCES accounting_daily_cash(id),
    journal_entry_id VARCHAR(50) NULL REFERENCES journal_entries(id),
    note TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS ap_bills (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(80) NOT NULL,
    supplier_id VARCHAR(80),
    supplier_name VARCHAR(255) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    document_id VARCHAR(50) NULL REFERENCES document_center_document(id),
    tax_code_id VARCHAR(50) NULL REFERENCES tax_codes(id),
    expense_account_code VARCHAR(20) NOT NULL DEFAULT '642',
    base_amount DOUBLE PRECISION DEFAULT 0,
    tax_rate DOUBLE PRECISION DEFAULT 0,
    tax_amount DOUBLE PRECISION DEFAULT 0,
    total_amount DOUBLE PRECISION DEFAULT 0,
    paid_amount DOUBLE PRECISION DEFAULT 0,
    balance_amount DOUBLE PRECISION DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    status VARCHAR(30) DEFAULT 'draft',
    description TEXT,
    journal_entry_id VARCHAR(50) NULL REFERENCES journal_entries(id),
    confirmed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS ap_bill_payments (
    id VARCHAR(50) PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL REFERENCES ap_bills(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    payment_date DATE NOT NULL,
    amount DOUBLE PRECISION DEFAULT 0,
    payment_method VARCHAR(30) DEFAULT 'cash',
    daily_cash_id VARCHAR(50) NULL REFERENCES accounting_daily_cash(id),
    journal_entry_id VARCHAR(50) NULL REFERENCES journal_entries(id),
    note TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS fixed_assets (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(80) NOT NULL,
    name VARCHAR(255) NOT NULL,
    purchase_date DATE NOT NULL,
    capitalized_date DATE,
    cost DOUBLE PRECISION DEFAULT 0,
    salvage_value DOUBLE PRECISION DEFAULT 0,
    useful_life_months INTEGER NOT NULL,
    monthly_depreciation DOUBLE PRECISION DEFAULT 0,
    accumulated_depreciation DOUBLE PRECISION DEFAULT 0,
    department VARCHAR(100),
    asset_account_code VARCHAR(20) DEFAULT '211',
    accumulated_account_code VARCHAR(20) DEFAULT '214',
    expense_account_code VARCHAR(20) DEFAULT '642',
    status VARCHAR(30) DEFAULT 'active',
    source_document_id VARCHAR(50) NULL REFERENCES document_center_document(id),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS fixed_asset_depreciations (
    id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    period_key VARCHAR(7) NOT NULL,
    depreciation_date DATE NOT NULL,
    amount DOUBLE PRECISION DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft',
    journal_entry_id VARCHAR(50) NULL REFERENCES journal_entries(id),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE TABLE IF NOT EXISTS accounting_links (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    source_type VARCHAR(40) NOT NULL,
    source_id VARCHAR(80) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id VARCHAR(80) NOT NULL,
    note VARCHAR(255),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_chart_of_accounts_lead_code
    ON chart_of_accounts (lead_id, code);
CREATE INDEX IF NOT EXISTS ix_chart_of_accounts_lead_type
    ON chart_of_accounts (lead_id, account_type);
CREATE UNIQUE INDEX IF NOT EXISTS ix_tax_codes_lead_code
    ON tax_codes (lead_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS ix_accounting_periods_lead_period
    ON accounting_periods (lead_id, period_key);
CREATE UNIQUE INDEX IF NOT EXISTS ix_journal_entries_lead_entry_no
    ON journal_entries (lead_id, entry_no);
CREATE INDEX IF NOT EXISTS ix_journal_entries_lead_date
    ON journal_entries (lead_id, entry_date);
CREATE INDEX IF NOT EXISTS ix_journal_entries_source
    ON journal_entries (source_type, source_id);
CREATE INDEX IF NOT EXISTS ix_journal_entry_lines_entry
    ON journal_entry_lines (journal_entry_id);
CREATE INDEX IF NOT EXISTS ix_journal_entry_lines_lead_account
    ON journal_entry_lines (lead_id, account_code);
CREATE UNIQUE INDEX IF NOT EXISTS ix_ar_invoices_lead_code
    ON ar_invoices (lead_id, code);
CREATE INDEX IF NOT EXISTS ix_ar_invoices_lead_status
    ON ar_invoices (lead_id, status);
CREATE INDEX IF NOT EXISTS ix_ar_invoices_lead_due
    ON ar_invoices (lead_id, due_date);
CREATE INDEX IF NOT EXISTS ix_ar_invoice_payments_invoice
    ON ar_invoice_payments (invoice_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_ap_bills_lead_code
    ON ap_bills (lead_id, code);
CREATE INDEX IF NOT EXISTS ix_ap_bills_lead_status
    ON ap_bills (lead_id, status);
CREATE INDEX IF NOT EXISTS ix_ap_bills_lead_due
    ON ap_bills (lead_id, due_date);
CREATE INDEX IF NOT EXISTS ix_ap_bill_payments_bill
    ON ap_bill_payments (bill_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_fixed_assets_lead_code
    ON fixed_assets (lead_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS ix_fixed_asset_depreciations_asset_period
    ON fixed_asset_depreciations (asset_id, period_key);
CREATE INDEX IF NOT EXISTS ix_accounting_links_source
    ON accounting_links (lead_id, source_type, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_accounting_links_unique
    ON accounting_links (lead_id, source_type, source_id, target_type, target_id);

INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_111', NULL, '111', 'Tiền mặt', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '111');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_112', NULL, '112', 'Tiền gửi ngân hàng', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '112');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_131', NULL, '131', 'Phải thu khách hàng', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '131');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_133', NULL, '133', 'Thuế GTGT được khấu trừ', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '133');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_154', NULL, '154', 'Chi phí SXKD dở dang', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '154');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_155', NULL, '155', 'Thành phẩm', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '155');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_156', NULL, '156', 'Hàng hóa', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '156');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_211', NULL, '211', 'Tài sản cố định', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '211');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_214', NULL, '214', 'Hao mòn lũy kế', 'asset', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '214');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_331', NULL, '331', 'Phải trả nhà cung cấp', 'liability', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '331');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_3331', NULL, '3331', 'Thuế GTGT phải nộp', 'liability', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '3331');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_334', NULL, '334', 'Phải trả người lao động', 'liability', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '334');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_511', NULL, '511', 'Doanh thu bán hàng', 'revenue', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '511');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_632', NULL, '632', 'Giá vốn hàng bán', 'expense', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '632');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_622', NULL, '622', 'Chi phí nhân công trực tiếp', 'expense', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '622');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_627', NULL, '627', 'Chi phí sản xuất chung', 'expense', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '627');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_641', NULL, '641', 'Chi phí bán hàng', 'expense', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '641');
INSERT INTO chart_of_accounts (id, lead_id, code, name, account_type, parent_code, allow_posting, status)
SELECT 'coa_642', NULL, '642', 'Chi phí quản lý doanh nghiệp', 'expense', NULL, TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE lead_id IS NULL AND code = '642');

INSERT INTO tax_codes (id, lead_id, code, name, rate, direction, status, is_default)
SELECT 'tax_none', NULL, 'VAT0', 'Không chịu thuế / 0%', 0, 'both', 'active', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tax_codes WHERE lead_id IS NULL AND code = 'VAT0');
INSERT INTO tax_codes (id, lead_id, code, name, rate, direction, status, is_default)
SELECT 'tax_in_8', NULL, 'VATIN8', 'VAT đầu vào 8%', 8, 'input', 'active', FALSE
WHERE NOT EXISTS (SELECT 1 FROM tax_codes WHERE lead_id IS NULL AND code = 'VATIN8');
INSERT INTO tax_codes (id, lead_id, code, name, rate, direction, status, is_default)
SELECT 'tax_in_10', NULL, 'VATIN10', 'VAT đầu vào 10%', 10, 'input', 'active', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tax_codes WHERE lead_id IS NULL AND code = 'VATIN10');
INSERT INTO tax_codes (id, lead_id, code, name, rate, direction, status, is_default)
SELECT 'tax_out_8', NULL, 'VATOUT8', 'VAT đầu ra 8%', 8, 'output', 'active', FALSE
WHERE NOT EXISTS (SELECT 1 FROM tax_codes WHERE lead_id IS NULL AND code = 'VATOUT8');
INSERT INTO tax_codes (id, lead_id, code, name, rate, direction, status, is_default)
SELECT 'tax_out_10', NULL, 'VATOUT10', 'VAT đầu ra 10%', 10, 'output', 'active', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tax_codes WHERE lead_id IS NULL AND code = 'VATOUT10');

COMMIT;

BEGIN;

CREATE TABLE IF NOT EXISTS item_categories (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(80) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(80) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NULL,
    description TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(80) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(120) NULL,
    category_id VARCHAR(50) NULL REFERENCES item_categories(id),
    item_type VARCHAR(30) NOT NULL DEFAULT 'raw_material',
    unit VARCHAR(50) NOT NULL DEFAULT 'cái',
    default_supplier_id VARCHAR(80) NULL,
    default_supplier_name VARCHAR(255) NULL,
    default_warehouse_id VARCHAR(50) NULL REFERENCES warehouses(id),
    standard_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    average_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    min_stock_level DOUBLE PRECISION NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    note TEXT NULL,
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE TABLE IF NOT EXISTS stock_adjustment_reasons (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    code VARCHAR(80) NOT NULL,
    name VARCHAR(255) NOT NULL,
    effect_type VARCHAR(20) NOT NULL DEFAULT 'decrease',
    accounting_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE TABLE IF NOT EXISTS inventory_account_mappings (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    item_type VARCHAR(30) NULL,
    category_id VARCHAR(50) NULL REFERENCES item_categories(id),
    inventory_account_code VARCHAR(20) NOT NULL,
    cogs_account_code VARCHAR(20) NULL,
    expense_account_code VARCHAR(20) NULL,
    adjustment_gain_account_code VARCHAR(20) NULL,
    adjustment_loss_account_code VARCHAR(20) NULL,
    ap_account_code VARCHAR(20) NULL DEFAULT '331',
    cash_account_code VARCHAR(20) NULL DEFAULT '111',
    vat_account_code VARCHAR(20) NULL DEFAULT '133',
    wip_account_code VARCHAR(20) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE TABLE IF NOT EXISTS inventory_balances (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    item_id VARCHAR(50) NOT NULL REFERENCES inventory_items(id),
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(id),
    quantity_on_hand DOUBLE PRECISION NOT NULL DEFAULT 0,
    average_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    inventory_value DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    transaction_code VARCHAR(80) NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(id),
    destination_warehouse_id VARCHAR(50) NULL REFERENCES warehouses(id),
    item_id VARCHAR(50) NOT NULL REFERENCES inventory_items(id),
    quantity DOUBLE PRECISION NOT NULL,
    unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    direction VARCHAR(10) NOT NULL,
    balance_after DOUBLE PRECISION NULL,
    partner_id VARCHAR(80) NULL,
    partner_name VARCHAR(255) NULL,
    task_id VARCHAR(80) NULL,
    project_id VARCHAR(80) NULL,
    note TEXT NULL,
    reference_type VARCHAR(40) NULL,
    reference_id VARCHAR(80) NULL,
    reference_code VARCHAR(120) NULL,
    source_type VARCHAR(40) NULL,
    source_id VARCHAR(80) NULL,
    adjustment_reason_id VARCHAR(50) NULL REFERENCES stock_adjustment_reasons(id),
    accounting_entry_id VARCHAR(50) NULL REFERENCES journal_entries(id),
    reversal_transaction_id VARCHAR(50) NULL REFERENCES stock_transactions(id),
    confirmed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_by VARCHAR(50) NULL,
    approved_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_item_categories_lead_code ON item_categories(lead_id, code);
CREATE INDEX IF NOT EXISTS ix_item_categories_lead_status ON item_categories(lead_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_warehouses_lead_code ON warehouses(lead_id, code);
CREATE INDEX IF NOT EXISTS ix_warehouses_lead_status ON warehouses(lead_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_lead_code ON inventory_items(lead_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_lead_sku ON inventory_items(lead_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_inventory_items_lead_category ON inventory_items(lead_id, category_id);
CREATE INDEX IF NOT EXISTS ix_inventory_items_lead_active ON inventory_items(lead_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_adjustment_reasons_lead_code ON stock_adjustment_reasons(lead_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_balances_item_warehouse ON inventory_balances(item_id, warehouse_id);
CREATE INDEX IF NOT EXISTS ix_inventory_balances_lead_item ON inventory_balances(lead_id, item_id);
CREATE INDEX IF NOT EXISTS ix_inventory_balances_lead_warehouse ON inventory_balances(lead_id, warehouse_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_transactions_lead_code ON stock_transactions(lead_id, transaction_code);
CREATE INDEX IF NOT EXISTS ix_stock_transactions_lead_date ON stock_transactions(lead_id, transaction_date);
CREATE INDEX IF NOT EXISTS ix_stock_transactions_lead_status ON stock_transactions(lead_id, status);
CREATE INDEX IF NOT EXISTS ix_stock_transactions_item_warehouse ON stock_transactions(item_id, warehouse_id);
CREATE INDEX IF NOT EXISTS ix_stock_transactions_reference ON stock_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS ix_stock_transactions_source ON stock_transactions(source_type, source_id);

COMMIT;

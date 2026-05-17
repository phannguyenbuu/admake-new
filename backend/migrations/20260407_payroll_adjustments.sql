CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id VARCHAR(50) PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    user_id VARCHAR(50) NOT NULL REFERENCES "user"(id),
    adjustment_type VARCHAR(30) NOT NULL,
    entry_date DATE NOT NULL,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    note TEXT NULL,
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NULL
);

CREATE INDEX IF NOT EXISTS ix_payroll_adjustments_lead_user_date
    ON payroll_adjustments(lead_id, user_id, entry_date);

CREATE INDEX IF NOT EXISTS ix_payroll_adjustments_lead_type
    ON payroll_adjustments(lead_id, adjustment_type);

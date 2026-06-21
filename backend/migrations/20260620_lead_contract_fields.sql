-- Migration: Add contract + trial tracking fields to lead table
-- Date: 2026-06-20

-- Contract info fields
ALTER TABLE lead ADD COLUMN IF NOT EXISTS tax_code VARCHAR(50);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS legal_rep VARCHAR(255);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS legal_rep_position VARCHAR(100);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS invoice_email VARCHAR(255);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

-- Plan selection
ALTER TABLE lead ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS selected_billing VARCHAR(10);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS contract_amount INTEGER;

-- Contract status tracking
ALTER TABLE lead ADD COLUMN IF NOT EXISTS contract_status VARCHAR(20);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS contract_submitted_at TIMESTAMP;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP;

-- Trial tracking
ALTER TABLE lead ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP;

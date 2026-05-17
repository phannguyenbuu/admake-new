-- Add quantity column to fixed_assets
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Create fixed_asset_events table
CREATE TABLE IF NOT EXISTS fixed_asset_events (
    id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES lead(id),
    event_type VARCHAR(30) NOT NULL DEFAULT 'purchase',
    event_date DATE,
    person_name VARCHAR(255),
    note TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    version INTEGER
);

CREATE INDEX IF NOT EXISTS ix_fa_events_asset ON fixed_asset_events(asset_id);
CREATE INDEX IF NOT EXISTS ix_fa_events_lead ON fixed_asset_events(lead_id);

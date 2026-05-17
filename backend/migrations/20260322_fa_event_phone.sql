-- Add person_phone column to fixed_asset_events
ALTER TABLE fixed_asset_events ADD COLUMN IF NOT EXISTS person_phone VARCHAR(30);

-- Add preview_material column to inventory_items for 3D material preview
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS preview_material VARCHAR(80) DEFAULT 'lumion_standard';

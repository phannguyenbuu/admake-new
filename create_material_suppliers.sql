CREATE TABLE IF NOT EXISTS material_suppliers (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website_link TEXT,
    phone VARCHAR(50),
    address VARCHAR(550),
    note TEXT,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial suppliers from existing inventory_items
INSERT INTO material_suppliers (id, name, website_link)
SELECT 
    'sup_' || MD5(default_supplier_name),
    default_supplier_name,
    MAX(supplier_link)
FROM inventory_items
WHERE default_supplier_name IS NOT NULL 
  AND TRIM(default_supplier_name) != '' 
  AND default_supplier_name != 'Đại lý Vật tư'
GROUP BY default_supplier_name
ON CONFLICT (id) DO NOTHING;

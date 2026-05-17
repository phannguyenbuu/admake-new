-- Migration: Copy default roles to each lead that has users
-- Default roles: id 1-9, 101 (exclude -2 LEAD and -1 CUSTOMER which are system roles)
-- Only copy to leads that don't already have roles assigned

-- Fix sequence to avoid duplicate key errors
SELECT setval('role_id_seq', (SELECT MAX(id) FROM role));

DO $$
DECLARE
    lead_rec RECORD;
    role_rec RECORD;
BEGIN
    -- Loop through all leads that have at least one user and don't yet have roles
    FOR lead_rec IN 
        SELECT DISTINCT lead_id 
        FROM public.user 
        WHERE lead_id IS NOT NULL
          AND lead_id NOT IN (SELECT DISTINCT lead_id FROM role WHERE lead_id IS NOT NULL)
    LOOP
        -- For each lead, copy the "real" default roles (id 1..9 and 101)
        FOR role_rec IN 
            SELECT name, permissions FROM role 
            WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 101)
        LOOP
            INSERT INTO role (name, permissions, lead_id)
            VALUES (role_rec.name, role_rec.permissions, lead_rec.lead_id);
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migration completed: roles copied for all leads with users.';
END $$;


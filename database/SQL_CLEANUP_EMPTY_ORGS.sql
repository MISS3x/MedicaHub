-- ==================================================
-- CLEANUP: Smazat organizace bez uživatelů
-- ==================================================

-- 1. KONTROLA: Kolik organizací nemá uživatele?
SELECT 
    o.id,
    o.name,
    o.subscription_plan,
    COUNT(p.id) as user_count
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
GROUP BY o.id, o.name, o.subscription_plan
HAVING COUNT(p.id) = 0;

-- 2. SMAZAT organizace bez uživatelů (a jejich data)
DO $$
DECLARE
    org_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    FOR org_record IN 
        SELECT o.id, o.name
        FROM organizations o
        LEFT JOIN profiles p ON p.organization_id = o.id
        GROUP BY o.id, o.name
        HAVING COUNT(p.id) = 0
    LOOP
        RAISE NOTICE 'Deleting organization: % (ID: %)', org_record.name, org_record.id;
        
        -- Smazat související záznamy z CORE tabulek
        DELETE FROM termolog_entries WHERE organization_id = org_record.id;
        DELETE FROM termo_sensors WHERE organization_id = org_record.id;
        DELETE FROM medlog_entries WHERE organization_id = org_record.id;
        DELETE FROM active_apps WHERE organization_id = org_record.id;
        DELETE FROM operational_tasks WHERE organization_id = org_record.id;
        DELETE FROM med_inventory WHERE organization_id = org_record.id;
        DELETE FROM billing_details WHERE organization_id = org_record.id;
        
        -- Smazat organizaci
        DELETE FROM organizations WHERE id = org_record.id;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Total deleted: % organizations', deleted_count;
END $$;

-- 3. KONTROLA: Kolik organizací zůstalo?
SELECT 
    o.id,
    o.name,
    o.subscription_plan,
    o.credits,
    COUNT(p.id) as user_count
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
GROUP BY o.id, o.name, o.subscription_plan, o.credits
ORDER BY o.name;

-- 4. KONTROLA admin VIEW
SELECT * FROM admin_app_management ORDER BY email;

-- 5. FIX demo@medicahub.cz account (pokud je potřeba)
-- Zkontroluj že má správnou organizaci a aplikace
UPDATE organizations 
SET 
    subscription_plan = 'free',
    credits = 500,
    brain_enabled = FALSE
WHERE name = 'Medica Hub';

-- Zkontroluj že má všechny aplikace v active_apps
-- (spustí se automaticky při registraci, ale pokud chybí:)
DO $$
DECLARE
    org_id UUID;
    app_codes TEXT[] := ARRAY['termolog', 'eventlog', 'medlog', 'voicelog', 'reporty', 'patients', 'sterilog'];
    app_code TEXT;
BEGIN
    SELECT id INTO org_id FROM organizations WHERE name = 'Medica Hub';
    
    IF org_id IS NOT NULL THEN
        FOREACH app_code IN ARRAY app_codes
        LOOP
            INSERT INTO active_apps (organization_id, app_code, is_enabled)
            VALUES (org_id, app_code, FALSE)
            ON CONFLICT (organization_id, app_code) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Fixed apps for Medica Hub';
    END IF;
END $$;

-- FINAL CHECK
SELECT 
    'Organizations' as table_name,
    COUNT(*) as count
FROM organizations
UNION ALL
SELECT 
    'Profiles',
    COUNT(*)
FROM profiles
UNION ALL
SELECT 
    'Auth Users',
    COUNT(*)
FROM auth.users
UNION ALL
SELECT 
    'Active Apps',
    COUNT(*)
FROM active_apps;

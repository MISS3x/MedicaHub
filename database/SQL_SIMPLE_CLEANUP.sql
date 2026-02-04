-- ==================================================
-- SIMPLE CLEANUP: Smazat všechny uživatele kromě demo@medicahub.cz
-- ==================================================

-- 1. KONTROLA: Kolik uživatelů máme?
SELECT 
    au.email,
    p.full_name,
    o.name as organization
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN organizations o ON o.id = p.organization_id
ORDER BY au.email;

-- 2. SMAZAT všechny uživatele kromě demo@medicahub.cz
-- NEJDŘÍV smazat profiles, pak auth.users (kvůli foreign keys)
DO $$
DECLARE
    user_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    FOR user_record IN 
        SELECT au.id, au.email, p.organization_id
        FROM auth.users au
        LEFT JOIN profiles p ON p.id = au.id
        WHERE au.email != 'demo@medicahub.cz'
    LOOP
        RAISE NOTICE 'Deleting user: % (ID: %)', user_record.email, user_record.id;
        
        -- Smazat profil
        DELETE FROM profiles WHERE id = user_record.id;
        
        -- Smazat auth uživatele
        DELETE FROM auth.users WHERE id = user_record.id;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Total deleted: % users', deleted_count;
END $$;

-- 3. SMAZAT prázdné organizace (které zbyly bez uživatelů)
-- Nejdřív smazat všechny související data, pak organizace
DELETE FROM termolog_entries 
WHERE organization_id NOT IN (
    SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL
);

DELETE FROM termo_sensors 
WHERE organization_id NOT IN (
    SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL
);

DELETE FROM medlog_entries 
WHERE organization_id NOT IN (
    SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL
);

DELETE FROM active_apps 
WHERE organization_id NOT IN (
    SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL
);

DELETE FROM operational_tasks 
WHERE organization_id NOT IN (
    SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL
);

DELETE FROM med_inventory 
WHERE organization_id NOT IN (
    SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL
);

DELETE FROM billing_details 
WHERE organization_id NOT IN (
    SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL
);

DELETE FROM organizations 
WHERE id NOT IN (
    SELECT DISTINCT organization_id 
    FROM profiles 
    WHERE organization_id IS NOT NULL
);

-- 4. KONTROLA: Co zbylo?
SELECT 
    au.email,
    p.full_name,
    o.name as organization,
    o.subscription_plan as tier,
    o.credits
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN organizations o ON o.id = p.organization_id
ORDER BY au.email;

-- 5. ADMIN VIEW
SELECT * FROM admin_app_management ORDER BY email;

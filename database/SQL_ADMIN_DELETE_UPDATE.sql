-- ==================================================
-- SQL FUNKCE pro Admin Panel - DELETE a UPDATE (FIXED)
-- ==================================================

-- 1. Funkce pro smazání uživatele (kaskádové) - KOMPLETNÍ
CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id UUID)
RETURNS void AS $$
DECLARE
    target_org_id UUID;
BEGIN
    -- Najít organization_id uživatele
    SELECT organization_id INTO target_org_id
    FROM profiles
    WHERE id = target_user_id;

    IF target_org_id IS NULL THEN
        RAISE EXCEPTION 'User organization not found';
    END IF;

    -- Smazat data ze VŠECH existujících aplikačních tabulek
    DELETE FROM termolog_entries WHERE organization_id = target_org_id;
    DELETE FROM termo_sensors WHERE organization_id = target_org_id;
    DELETE FROM medlog_entries WHERE organization_id = target_org_id;
    DELETE FROM active_apps WHERE organization_id = target_org_id;
    DELETE FROM operational_tasks WHERE organization_id = target_org_id;
    
    -- Smazat profil
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Smazat organizaci
    DELETE FROM organizations WHERE id = target_org_id;
    
    -- Smazat auth.users (použije SECURITY DEFINER pro admin práva)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Admin VIEW s VŠEMI potřebnými sloupci
DROP VIEW IF EXISTS admin_app_management CASCADE;

CREATE OR REPLACE VIEW admin_app_management AS
SELECT 
    au.id as user_id,
    p.id as profile_id,
    COALESCE(p.full_name, 'Uživatel') as full_name,
    au.email,
    o.id as organization_id,
    o.name as organization,
    o.subscription_plan as tier,
    o.credits,
    o.brain_enabled,
    -- Pivot: Každá aplikace jako sloupec
    BOOL_OR(CASE WHEN aa.app_code = 'termolog' THEN aa.is_enabled ELSE false END) as termolog,
    BOOL_OR(CASE WHEN aa.app_code = 'eventlog' THEN aa.is_enabled ELSE false END) as eventlog,
    BOOL_OR(CASE WHEN aa.app_code = 'medlog' THEN aa.is_enabled ELSE false END) as medlog,
    BOOL_OR(CASE WHEN aa.app_code = 'voicelog' THEN aa.is_enabled ELSE false END) as voicelog,
    BOOL_OR(CASE WHEN aa.app_code = 'reporty' THEN aa.is_enabled ELSE false END) as reporty,
    BOOL_OR(CASE WHEN aa.app_code = 'patients' THEN aa.is_enabled ELSE false END) as patients,
    BOOL_OR(CASE WHEN aa.app_code = 'sterilog' THEN aa.is_enabled ELSE false END) as sterilog
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN active_apps aa ON aa.organization_id = o.id
WHERE au.email IS NOT NULL
GROUP BY au.id, p.id, p.full_name, au.email, o.id, o.name, o.subscription_plan, o.credits, o.brain_enabled
ORDER BY au.email;


-- 3. TEST
SELECT * FROM admin_app_management;

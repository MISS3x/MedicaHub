-- ==================================================
-- ADMIN VIEW: Správa aplikací podle organizací (FIXED)
-- ==================================================

-- 1. Vytvořit extension tablefunc pokud neexistuje
CREATE EXTENSION IF NOT EXISTS tablefunc;

-- 2. Vytvořit VIEW s VŠEMI potřebnými sloupci
DROP VIEW IF EXISTS admin_app_management CASCADE;

CREATE OR REPLACE VIEW admin_app_management AS
SELECT 
    au.id as user_id,
    p.id as profile_id,
    o.id as organization_id,
    COALESCE(p.full_name, 'Uživatel') as full_name,
    au.email,
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
WHERE au.email IS NOT NULL  -- Jen organizace s přiřazeným uživatelem
GROUP BY au.id, p.id, o.id, p.full_name, au.email, o.name, o.subscription_plan, o.credits, o.brain_enabled
ORDER BY au.email;


-- 3. TEST zobrazení
SELECT * FROM admin_app_management LIMIT 5;

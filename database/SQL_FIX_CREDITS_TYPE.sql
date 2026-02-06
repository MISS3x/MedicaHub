-- Fix credits column type to support small fractional deductions
-- We need to change organizations.credits -> NUMERIC(15, 6)

-- 1. DROP DEPENDENT VIEW
DROP VIEW IF EXISTS admin_app_management CASCADE;

-- 2. ALTER COLUMN
ALTER TABLE public.organizations 
ALTER COLUMN credits TYPE NUMERIC(15, 6) 
USING credits::NUMERIC(15, 6);

-- 3. RE-CREATE VIEW (Definition from SQL_ADMIN_VIEW_FIXED.sql)
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
WHERE au.email IS NOT NULL
GROUP BY au.id, p.id, o.id, p.full_name, au.email, o.name, o.subscription_plan, o.credits, o.brain_enabled
ORDER BY au.email;

-- Verify grants on view (optional, standard permissions apply)
-- GRANT SELECT ON admin_app_management TO authenticated; -- usually views need explicit grants or depend on underlying

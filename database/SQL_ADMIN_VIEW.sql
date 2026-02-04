-- ==================================================
-- ADMIN VIEW: Správa aplikací podle organizací
-- ==================================================
-- Tato VIEW zobrazuje každou organizaci s jejími aplikacemi jako sloupce

-- 1. Vytvořit VIEW s PIVOT strukturou (crosstab)
-- Nejdřív potřebujeme extension tablefunc
CREATE EXTENSION IF NOT EXISTS tablefunc;

-- 2. Vytvořit VIEW
CREATE OR REPLACE VIEW admin_app_management AS
SELECT 
    o.id as organization_id,
    o.name as organization,
    au.email,
    o.subscription_plan as tier,
    o.credits,
    -- Pivot: Každá aplikace jako sloupec (použijeme BOOL_OR místo MAX)
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
GROUP BY o.id, o.name, au.email, o.subscription_plan, o.credits
ORDER BY au.email;

-- 3. Helper funkce pro zapínání/vypínání aplikací
CREATE OR REPLACE FUNCTION toggle_app(
    user_email TEXT,
    app_name TEXT,
    new_status BOOLEAN
) RETURNS void AS $$
BEGIN
    UPDATE active_apps
    SET is_enabled = new_status
    WHERE organization_id = (
        SELECT p.organization_id
        FROM profiles p
        JOIN auth.users au ON au.id = p.id
        WHERE au.email = user_email
    )
    AND app_code = app_name;
END;
$$ LANGUAGE plpgsql;

-- 4. Použití VIEW
-- Zobrazit admin panel:
SELECT * FROM admin_app_management;

-- 5. Jak změnit aplikaci (pomocí funkce):
-- Příklad: Zapnout VoiceLog pro demo@medicahub.cz
-- SELECT toggle_app('demo@medicahub.cz', 'voicelog', TRUE);

-- Příklad: Vypnout EventLog pro demo@medicahub.cz
-- SELECT toggle_app('demo@medicahub.cz', 'eventlog', FALSE);

-- 6. Vytvořit také jednodušší verzi - seznam řádků
CREATE OR REPLACE VIEW admin_app_list AS
SELECT 
    au.email,
    o.name as organization,
    o.subscription_plan as tier,
    aa.app_code,
    aa.is_enabled
FROM organizations o
JOIN profiles p ON p.organization_id = o.id
JOIN auth.users au ON au.id = p.id
LEFT JOIN active_apps aa ON aa.organization_id = o.id
ORDER BY au.email, aa.app_code;

-- TEST
-- Zobrazit data:
SELECT * FROM admin_app_management WHERE email = 'demo@medicahub.cz';

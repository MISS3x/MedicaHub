-- ==================================================
-- COMPLETE APP LIST - Všechny organizace mají všechny aplikace
-- ==================================================
-- Tento přístup umožňuje jednoduché zapínání/vypínání aplikací pomocí is_enabled

-- 1. Seznam všech aplikací
CREATE TEMP TABLE all_apps AS
SELECT unnest(ARRAY[
    'termolog',
    'eventlog', 
    'medlog',
    'voicelog',
    'reporty',
    'patients',
    'sterilog'
]) AS app_code;

-- 2. Pro KAŽDOU organizaci přidat VŠECHNY aplikace (pokud ještě neexistují)
INSERT INTO active_apps (organization_id, app_code, is_enabled)
SELECT 
    o.id,
    a.app_code,
    -- FREE tier: Zapnout jen termolog, eventlog, medlog
    CASE 
        WHEN o.subscription_plan = 'free' AND a.app_code IN ('termolog', 'eventlog', 'medlog') THEN TRUE
        -- PRO tier: Zapnout všechny
        WHEN o.subscription_plan = 'pro' THEN TRUE
        -- Ostatní vypnout
        ELSE FALSE
    END AS is_enabled
FROM organizations o
CROSS JOIN all_apps a
ON CONFLICT (organization_id, app_code) DO NOTHING;

-- 3. Ověření - ukázat demo uživatele
SELECT 
    au.email,
    o.name as organization,
    o.subscription_plan,
    aa.app_code,
    aa.is_enabled
FROM auth.users au
JOIN profiles p ON p.id = au.id
JOIN organizations o ON o.id = p.organization_id
JOIN active_apps aa ON aa.organization_id = o.id
WHERE au.email = 'demo@medicahub.cz'
ORDER BY aa.app_code;

-- 4. Jak zapnout/vypnout aplikaci pro konkrétní organizaci
-- Příklad: Zapnout VoiceLog pro demo uživatele
/*
UPDATE active_apps
SET is_enabled = TRUE
WHERE organization_id = (
    SELECT p.organization_id
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE au.email = 'demo@medicahub.cz'
)
AND app_code = 'voicelog';
*/

-- 5. Vypnout aplikaci
/*
UPDATE active_apps
SET is_enabled = FALSE
WHERE organization_id = (...)
AND app_code = 'voicelog';
*/

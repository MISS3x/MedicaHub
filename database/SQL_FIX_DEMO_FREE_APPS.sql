-- ==================================================
-- Oprava demo účtu - nastavení FREE aplikací
-- ==================================================
-- Demo uživatel má mít jen: termolog, eventlog, medlog

-- 1. KONTROLA - co má teď demo uživatel
SELECT 
    au.email,
    o.name as organization,
    o.subscription_plan,
    array_agg(aa.app_code) as current_apps
FROM auth.users au
JOIN profiles p ON p.id = au.id
JOIN organizations o ON o.id = p.organization_id
LEFT JOIN active_apps aa ON aa.organization_id = o.id
WHERE au.email = 'demo@medicahub.cz'
GROUP BY au.email, o.name, o.subscription_plan;

-- 2. OPRAVA - smazat všechny apps a přidat jen FREE
DELETE FROM active_apps
WHERE organization_id = (
    SELECT p.organization_id 
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE au.email = 'demo@medicahub.cz'
);

-- Přidat jen FREE aplikace
INSERT INTO active_apps (organization_id, app_code)
SELECT 
    p.organization_id,
    app_code
FROM profiles p
JOIN auth.users au ON au.id = p.id
CROSS JOIN (
    VALUES ('termolog'), ('eventlog'), ('medlog')
) AS apps(app_code)
WHERE au.email = 'demo@medicahub.cz';

-- 3. OVĚŘENÍ - co má teď
SELECT 
    au.email,
    o.name as organization,
    o.subscription_plan,
    array_agg(aa.app_code) as active_apps
FROM auth.users au
JOIN profiles p ON p.id = au.id
JOIN organizations o ON o.id = p.organization_id
LEFT JOIN active_apps aa ON aa.organization_id = o.id
WHERE au.email = 'demo@medicahub.cz'
GROUP BY au.email, o.name, o.subscription_plan;

-- DEBUG: Zkontroluj co vrací VIEW pro demo@medicahub.cz
SELECT 
    email,
    tier,
    credits,
    brain_enabled,
    termolog,
    eventlog,
    medlog,
    voicelog,
    reporty,
    patients,
    sterilog
FROM admin_app_management
WHERE email = 'demo@medicahub.cz';

-- DEBUG: Zkontroluj active_apps pro demo účet
SELECT 
    aa.app_code,
    aa.is_enabled,
    o.subscription_plan as tier
FROM active_apps aa
JOIN organizations o ON o.id = aa.organization_id
JOIN profiles p ON p.organization_id = o.id
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'demo@medicahub.cz'
ORDER BY aa.app_code;

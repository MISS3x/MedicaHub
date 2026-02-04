-- DEBUG: Zkontroluj kolik účtů je v databázi
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

-- DEBUG: Co vrací admin VIEW?
SELECT * FROM admin_app_management ORDER BY email;

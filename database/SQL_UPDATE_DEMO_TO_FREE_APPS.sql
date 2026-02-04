-- Update demo user to have all FREE apps (termolog, eventlog, medlog)

-- First, get the organization_id for demo user
DO $$
DECLARE
    demo_org_id UUID;
BEGIN
    -- Get demo user's organization
    SELECT organization_id INTO demo_org_id
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE au.email = 'demo@medicahub.cz';

    IF demo_org_id IS NOT NULL THEN
        -- Delete all active apps for this org
        DELETE FROM active_apps WHERE organization_id = demo_org_id;

        -- Add FREE apps (termolog, eventlog, medlog)
        INSERT INTO active_apps (organization_id, app_code)
        VALUES 
            (demo_org_id, 'termolog'),
            (demo_org_id, 'eventlog'),
            (demo_org_id, 'medlog')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Demo user updated - now has FREE apps (termolog, eventlog, medlog)';
    ELSE
        RAISE NOTICE 'Demo user organization not found';
    END IF;
END $$;

-- Verify
SELECT 
    au.email,
    o.subscription_plan,
    array_agg(aa.app_code) as active_apps
FROM profiles p
JOIN auth.users au ON au.id = p.id
LEFT JOIN organizations o ON o.id = p.organization_id
LEFT JOIN active_apps aa ON aa.organization_id = p.organization_id
WHERE au.email = 'demo@medicahub.cz'
GROUP BY au.email, o.subscription_plan;

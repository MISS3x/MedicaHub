-- Fix users without organization
-- This script creates organizations for existing users who don't have one

DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
BEGIN
    -- Loop through all profiles without organization_id
    FOR user_record IN 
        SELECT p.id, p.full_name, au.email
        FROM profiles p
        JOIN auth.users au ON au.id = p.id
        WHERE p.organization_id IS NULL
    LOOP
        -- Create organization for this user
        INSERT INTO organizations (name, subscription_plan, credits)
        VALUES (
            COALESCE(user_record.full_name || ' - Ordinace', 'Ordinace ' || user_record.email),
            'free',
            100
        )
        RETURNING id INTO new_org_id;

        -- Update profile with organization_id
        UPDATE profiles
        SET organization_id = new_org_id
        WHERE id = user_record.id;

        -- Add default free apps
        INSERT INTO active_apps (organization_id, app_code)
        VALUES 
            (new_org_id, 'eventlog'),
            (new_org_id, 'medlog'),
            (new_org_id, 'termolog')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Fixed user: % (org_id: %)', user_record.email, new_org_id;
    END LOOP;
END $$;

-- Verify the fix
SELECT 
    au.email,
    p.full_name,
    p.organization_id,
    o.name as org_name,
    o.credits,
    o.subscription_plan
FROM profiles p
JOIN auth.users au ON au.id = p.id
LEFT JOIN organizations o ON o.id = p.organization_id
ORDER BY au.email;

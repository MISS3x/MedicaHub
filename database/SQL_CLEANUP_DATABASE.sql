-- ⚠️⚠️⚠️ DANGER ZONE ⚠️⚠️⚠️
-- This script DELETES all users and data EXCEPT for "MedicaHub" organization
-- Use with EXTREME caution! This action is IRREVERSIBLE!

-- ==================================================
-- STEP 1: PREVIEW - What will be deleted
-- ==================================================
-- Run this FIRST to see what will be deleted

SELECT 'USERS TO DELETE:' as action, 
       au.email, 
       p.full_name,
       o.name as org_name
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE o.name IS DISTINCT FROM 'MedicaHub'
   OR o.name IS NULL;

SELECT 'ORGANIZATIONS TO DELETE:' as action,
       name, 
       subscription_plan,
       credits
FROM organizations
WHERE name IS DISTINCT FROM 'MedicaHub';

-- ==================================================
-- STEP 2: DELETE (Uncomment to execute)
-- ==================================================
-- ⚠️ ONLY RUN THIS IF YOU'RE ABSOLUTELY SURE! ⚠️

/*
DO $$
DECLARE
    org_to_keep UUID;
    user_record RECORD;
    org_record RECORD;
    deleted_users INT := 0;
    deleted_orgs INT := 0;
BEGIN
    -- Find the MedicaHub organization ID
    SELECT id INTO org_to_keep
    FROM organizations
    WHERE name = 'MedicaHub'
    LIMIT 1;

    RAISE NOTICE 'Keeping organization: %', org_to_keep;

    -- Delete users NOT in MedicaHub organization
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN profiles p ON p.id = au.id
        LEFT JOIN organizations o ON o.id = p.organization_id
        WHERE (o.id IS DISTINCT FROM org_to_keep OR o.id IS NULL)
    LOOP
        -- Delete from auth.users (cascade will handle profiles)
        DELETE FROM auth.users WHERE id = user_record.id;
        deleted_users := deleted_users + 1;
        RAISE NOTICE 'Deleted user: %', user_record.email;
    END LOOP;

    -- Delete organizations NOT named "MedicaHub"
    FOR org_record IN 
        SELECT id, name
        FROM organizations
        WHERE id IS DISTINCT FROM org_to_keep
    LOOP
        -- Delete active_apps first (foreign key)
        DELETE FROM active_apps WHERE organization_id = org_record.id;
        
        -- Delete billing_details if exists
        DELETE FROM billing_details WHERE organization_id = org_record.id;
        
        -- Delete operational_tasks if exists
        DELETE FROM operational_tasks WHERE organization_id = org_record.id;
        
        -- Delete organization
        DELETE FROM organizations WHERE id = org_record.id;
        deleted_orgs := deleted_orgs + 1;
        RAISE NOTICE 'Deleted organization: %', org_record.name;
    END LOOP;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'CLEANUP COMPLETE';
    RAISE NOTICE 'Deleted users: %', deleted_users;
    RAISE NOTICE 'Deleted organizations: %', deleted_orgs;
    RAISE NOTICE 'Kept organization: MedicaHub';
    RAISE NOTICE '===========================================';
END $$;
*/

-- ==================================================
-- STEP 3: VERIFY - Check what remains
-- ==================================================
-- Run this AFTER cleanup to verify

/*
SELECT 'REMAINING USERS:' as info, 
       au.email, 
       p.full_name,
       o.name as org_name
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN organizations o ON o.id = p.organization_id;

SELECT 'REMAINING ORGANIZATIONS:' as info,
       name, 
       subscription_plan,
       credits,
       (SELECT COUNT(*) FROM active_apps WHERE organization_id = organizations.id) as app_count
FROM organizations;
*/

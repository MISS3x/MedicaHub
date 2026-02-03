-- ==================================================
-- ADD BRAIN CONTROL to Organizations
-- ==================================================

-- 1. Add brain_enabled column to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS brain_enabled BOOLEAN DEFAULT FALSE;

-- 2. Enable brain for PRO users by default
UPDATE organizations
SET brain_enabled = TRUE
WHERE subscription_plan = 'pro';

-- 3. Update admin VIEW to include brain_enabled
DROP VIEW IF EXISTS admin_app_management CASCADE;

CREATE OR REPLACE VIEW admin_app_management AS
SELECT 
    p.id as user_id,
    p.full_name,
    o.id as organization_id,
    o.name as organization,
    au.email,
    o.subscription_plan as tier,
    o.credits,
    o.brain_enabled,  -- NEW COLUMN
    BOOL_OR(CASE WHEN aa.app_code = 'termolog' THEN aa.is_enabled ELSE false END) as termolog,
    BOOL_OR(CASE WHEN aa.app_code = 'eventlog' THEN aa.is_enabled ELSE false END) as eventlog,
    BOOL_OR(CASE WHEN aa.app_code = 'medlog' THEN aa.is_enabled ELSE false END) as medlog,
    BOOL_OR(CASE WHEN aa.app_code = 'voicelog' THEN aa.is_enabled ELSE false END) as voicelog,
    BOOL_OR(CASE WHEN aa.app_code = 'reporty' THEN aa.is_enabled ELSE false END) as reporty,
    BOOL_OR(CASE WHEN aa.app_code = 'patients' THEN aa.is_enabled ELSE false END) as patients,
    BOOL_OR(CASE WHEN aa.app_code = 'sterilog' THEN aa.is_enabled ELSE false END) as sterilog
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN active_apps aa ON aa.organization_id = o.id
WHERE au.email IS NOT NULL
GROUP BY p.id, p.full_name, o.id, o.name, au.email, o.subscription_plan, o.credits, o.brain_enabled
ORDER BY au.email;

-- 4. Create function to toggle brain
CREATE OR REPLACE FUNCTION toggle_brain_by_email(
    user_email TEXT,
    new_status BOOLEAN
) RETURNS void AS $$
BEGIN
    UPDATE organizations
    SET brain_enabled = new_status
    WHERE id = (
        SELECT p.organization_id
        FROM profiles p
        JOIN auth.users au ON au.id = p.id
        WHERE au.email = user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to update tier
CREATE OR REPLACE FUNCTION update_tier_by_email(
    user_email TEXT,
    new_tier TEXT
) RETURNS void AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get organization ID
    SELECT p.organization_id INTO org_id
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE au.email = user_email;

    -- Update tier
    UPDATE organizations
    SET subscription_plan = new_tier
    WHERE id = org_id;
    
    -- If upgrading to PRO, enable brain AND all apps
    IF new_tier = 'pro' THEN
        -- Enable brain
        UPDATE organizations
        SET brain_enabled = TRUE
        WHERE id = org_id;
        
        -- Enable ALL apps for this organization
        UPDATE active_apps
        SET is_enabled = TRUE
        WHERE organization_id = org_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TEST
SELECT email, tier, brain_enabled FROM admin_app_management;

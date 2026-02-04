-- ==================================================
-- TRIGGER: Automatic Profile & Organization Creation
-- ==================================================
-- This trigger runs when a new user signs up via Supabase Auth
-- It automatically creates:
-- 1. An organization
-- 2. A profile linked to that organization
-- 3. Default free apps for the organization

-- Function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    user_full_name TEXT;
    user_org_name TEXT;
BEGIN
    -- Get metadata from auth.users
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
    user_org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Moje Ordinace');

    -- 1. Create organization
    INSERT INTO public.organizations (name, subscription_plan, credits)
    VALUES (user_org_name, 'free', 100)
    RETURNING id INTO new_org_id;

    -- 2. Create profile linked to organization
    INSERT INTO public.profiles (id, full_name, organization_id)
    VALUES (NEW.id, user_full_name, new_org_id);

    -- 3. Add ALL apps with is_enabled flag
    -- FREE users: termolog, eventlog, medlog = TRUE, rest = FALSE
    INSERT INTO public.active_apps (organization_id, app_code, is_enabled)
    VALUES 
        (new_org_id, 'termolog', true),
        (new_org_id, 'eventlog', true),
        (new_org_id, 'medlog', true),
        (new_org_id, 'voicelog', false),
        (new_org_id, 'reporty', false),
        (new_org_id, 'patients', false),
        (new_org_id, 'sterilog', false)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Verify trigger is created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

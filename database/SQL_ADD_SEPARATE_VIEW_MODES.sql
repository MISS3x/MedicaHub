
-- Add dashboard_view_mode_mobile and dashboard_view_mode_desktop columns to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dashboard_view_mode_mobile') THEN
        ALTER TABLE profiles ADD COLUMN dashboard_view_mode_mobile text DEFAULT 'nodes';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dashboard_view_mode_desktop') THEN
        ALTER TABLE profiles ADD COLUMN dashboard_view_mode_desktop text DEFAULT 'nodes';
    END IF;
END $$;

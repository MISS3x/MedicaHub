
-- Add dashboard_view_mode column to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dashboard_view_mode') THEN
        ALTER TABLE profiles ADD COLUMN dashboard_view_mode text DEFAULT 'nodes';
    END IF;
END $$;

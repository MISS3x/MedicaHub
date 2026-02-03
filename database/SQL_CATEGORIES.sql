-- Create task_categories table
CREATE TABLE IF NOT EXISTS task_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL, -- We will link this via policy, specific FK constraint might fail if organizations table isn't exactly as expected in previous context, but usually it is public.organizations(id)
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- Storing hex code e.g. '#EF4444'
    icon TEXT NOT NULL, -- Storing icon name e.g. 'phone'
    is_system BOOLEAN DEFAULT FALSE, -- If true, maybe prevent deletion (optional)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their org categories" ON task_categories;
CREATE POLICY "Users can view their org categories" ON task_categories
    FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their org categories" ON task_categories;
CREATE POLICY "Users can manage their org categories" ON task_categories
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Add category_id to operational_tasks
-- We use DO block to add column only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operational_tasks' AND column_name = 'category_id') THEN
        ALTER TABLE operational_tasks ADD COLUMN category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Populate Default Categories for existing organizations (This is a bit tricky in pure SQL without a specific org ID, 
-- but we can try to insert for all organizations found in profiles or just rely on the app to create defaults if missing.
-- For now, let's create a function to initialize defaults that we can call from the app)

CREATE OR REPLACE FUNCTION initialize_default_categories(target_org_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM task_categories WHERE organization_id = target_org_id) THEN
        INSERT INTO task_categories (organization_id, name, color, icon, is_system) VALUES
        (target_org_id, 'Volat', '#3B82F6', 'phone', true), -- Blue
        (target_org_id, 'Objednat', '#8B5CF6', 'shopping-cart', true), -- Purple
        (target_org_id, 'Servis', '#F59E0B', 'wrench', true), -- Orange
        (target_org_id, 'Revize', '#EF4444', 'clipboard-list', true), -- Red
        (target_org_id, 'Laboratoř', '#14B8A6', 'flask-conical', true), -- Teal
        (target_org_id, 'Odpady', '#22C55E', 'trash-2', true), -- Green
        (target_org_id, 'Úklid', '#06B6D4', 'sparkles', true), -- Cyan
        (target_org_id, 'Administrativa', '#64748B', 'file-text', true), -- Slate
        (target_org_id, 'IT', '#6366F1', 'monitor', true), -- Indigo
        (target_org_id, 'Schůzka', '#EC4899', 'users', true); -- Pink
    END IF;
END;
$$ LANGUAGE plpgsql;

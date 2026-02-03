-- Nejprve vyčistíme starou definici, abychom začali nanovo (POZOR: smaže data v této tabulce, ale ta je zatím prázdná)
DROP TABLE IF EXISTS operational_tasks CASCADE;

-- Tabulka pro provozní úkoly ordinace
CREATE TABLE operational_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL, -- Zde explicitně uuid, FK přidáme níže
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  title text NOT NULL,
  due_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('revision', 'order', 'admin', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'expired')),
  
  contact_name text,
  contact_email text,
  contact_phone text,
  
  reminder_days integer DEFAULT 7,
  is_recurring boolean DEFAULT false,
  recurrence_interval text CHECK (recurrence_interval IN ('monthly', 'yearly', 'biannual')),
  
  google_calendar_sync boolean DEFAULT false,
  google_event_id text,
  description text
);

-- Přidání cizího klíče pro organizaci
ALTER TABLE operational_tasks
ADD CONSTRAINT fk_operational_tasks_organization
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- Zapnutí RLS
ALTER TABLE operational_tasks ENABLE ROW LEVEL SECURITY;

-- Politik pro čtení (Select)
CREATE POLICY "Users can view tasks from their organization"
ON operational_tasks FOR SELECT
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p 
    WHERE p.id = auth.uid()
  )
);

-- Politik pro vkládání (Insert)
CREATE POLICY "Users can insert tasks for their organization"
ON operational_tasks FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p 
    WHERE p.id = auth.uid()
  )
);

-- Politik pro úpravy (Update)
CREATE POLICY "Users can update tasks from their organization"
ON operational_tasks FOR UPDATE
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p 
    WHERE p.id = auth.uid()
  )
);

-- Politik pro mazání (Delete)
CREATE POLICY "Users can delete tasks from their organization"
ON operational_tasks FOR DELETE
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p 
    WHERE p.id = auth.uid()
  )
);

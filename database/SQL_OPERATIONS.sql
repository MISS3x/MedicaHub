-- Tabulka pro provozní úkoly ordinace (revize, objednávky, termíny)
create table if not exists operational_tasks (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  title text not null, -- Název úkolu (např. Revize EKG)
  due_date date not null, -- Datum platnosti/splnění
  category text not null check (category in ('revision', 'order', 'admin', 'other')), -- Kategorie
  status text not null default 'pending' check (status in ('pending', 'done', 'expired')), -- Stav
  
  -- Kontaktní údaje pro automatizaci
  contact_name text,
  contact_email text,
  contact_phone text,
  
  -- Nastavení připomínek
  reminder_days integer default 7, -- Kolik dní předem připomenout
  is_recurring boolean default false, -- Opakovaný úkol?
  recurrence_interval text check (recurrence_interval in ('monthly', 'yearly', 'biannual')), -- Interval
  
  -- Integrace
  google_calendar_sync boolean default false,
  google_event_id text,
  
  description text
);

-- RLS Policies (Bezpečnost)
alter table operational_tasks enable row level security;

create policy "Users can view tasks from their organization"
  on operational_tasks for select
  using (organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can insert tasks for their organization"
  on operational_tasks for insert
  with check (organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can update tasks from their organization"
  on operational_tasks for update
  using (organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can delete tasks from their organization"
  on operational_tasks for delete
  using (organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

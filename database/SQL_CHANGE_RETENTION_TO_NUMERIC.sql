-- Change voicelog_retention_hours to NUMERIC to support fractional hours (minutes)
ALTER TABLE public.profiles 
ALTER COLUMN voicelog_retention_hours TYPE NUMERIC;

-- Optional: Reset default to 24.0
ALTER TABLE public.profiles 
ALTER COLUMN voicelog_retention_hours SET DEFAULT 24.0;

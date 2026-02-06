-- Change due_date from DATE to TIMESTAMPTZ to support time
ALTER TABLE public.operational_tasks 
ALTER COLUMN due_date TYPE TIMESTAMP WITH TIME ZONE 
USING due_date::timestamp with time zone;

-- Optional: Comments
COMMENT ON COLUMN public.operational_tasks.due_date IS 'Due date and optional time of the task';

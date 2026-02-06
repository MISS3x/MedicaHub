-- Enable pg_cron extension if not already enabled (requires Supabase project with extensions support)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a job to run every 10 minutes to delete expired voicelogs
SELECT cron.schedule(
    'delete-expired-voicelogs', -- unique name of the job
    '*/10 * * * *',             -- every 10 minutes
    $$
    DELETE FROM public.voicelogs 
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW();
    $$
);

-- Note: To view scheduled jobs: SELECT * FROM cron.job;
-- To unschedule: SELECT cron.unschedule('delete-expired-voicelogs');

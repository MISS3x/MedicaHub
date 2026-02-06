
-- Add expiration column to voicelogs
ALTER TABLE public.voicelogs 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add retention setting to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS voicelog_retention_hours INTEGER DEFAULT 24;

-- Note for USER:
-- To enable automatic deletion, you should ideally set up a scheduled job (e.g., pg_cron or Supabase Edge Function).
-- Example logic for a cron job/function:
-- DELETE FROM public.voicelogs WHERE expires_at < NOW();

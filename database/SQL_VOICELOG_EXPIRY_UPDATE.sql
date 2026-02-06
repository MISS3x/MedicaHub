-- 1. Add expiration column to voicelogs table
ALTER TABLE public.voicelogs 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Add retention setting to profiles table with default 24 hours
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS voicelog_retention_hours INTEGER DEFAULT 24;

-- 3. Update the comment for clarity
COMMENT ON COLUMN public.profiles.voicelog_retention_hours IS 'Number of hours to keep voicelogs. 0 means keep forever.';
COMMENT ON COLUMN public.voicelogs.expires_at IS 'Timestamp when this record should be auto-deleted.';

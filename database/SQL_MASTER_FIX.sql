-- MASTER MIGRATION SCRIPT FOR VOICELOG & APP SETTINGS
-- Runs safely even if you run it multiple times (idempotent)

-- 1. VoiceLog Expiration
ALTER TABLE public.voicelogs 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.voicelogs.expires_at IS 'Timestamp when this record should be auto-deleted.';

-- 2. Profile Settings (Retention & Timeout & Theme)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS voicelog_retention_hours INTEGER DEFAULT 24;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inactivity_timeout_seconds INTEGER DEFAULT 30;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';

-- 3. Comments/Documentation
COMMENT ON COLUMN public.profiles.voicelog_retention_hours IS 'Number of hours to keep voicelogs. 0 means keep forever.';
COMMENT ON COLUMN public.profiles.inactivity_timeout_seconds IS 'Inactivity timeout in seconds. 0 = Never.';
COMMENT ON COLUMN public.profiles.theme IS 'UI Theme preference: light, dark, system';

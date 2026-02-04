-- Add inactivity_timeout logic to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inactivity_timeout_minutes INTEGER DEFAULT 1;

-- Update existing profiles to have default 30 seconds (0.5 minutes? no, prompt says 30sec, 1m, 2m etc)
-- Let's store it in seconds to be precise for 30s.

ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS inactivity_timeout_minutes;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inactivity_timeout_seconds INTEGER DEFAULT 30;

-- Comments for documentation
COMMENT ON COLUMN public.profiles.inactivity_timeout_seconds IS 'Inactivity timeout in seconds. 0 = Never.';


ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';

COMMENT ON COLUMN public.profiles.theme IS 'UI Theme preference: light, dark, system';

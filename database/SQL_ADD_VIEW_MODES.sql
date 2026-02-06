-- Add specialized view mode columns for responsive dashboard preference
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dashboard_view_mode_mobile TEXT DEFAULT 'nodes';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dashboard_view_mode_desktop TEXT DEFAULT 'nodes';

-- Optional: Comments
COMMENT ON COLUMN public.profiles.dashboard_view_mode_mobile IS 'Preferred dashboard view on mobile devices (nodes/tiles)';
COMMENT ON COLUMN public.profiles.dashboard_view_mode_desktop IS 'Preferred dashboard view on desktop devices (nodes/tiles)';

-- Migrate existing preferences if any
UPDATE public.profiles 
SET dashboard_view_mode_desktop = dashboard_view_mode,
    dashboard_view_mode_mobile = dashboard_view_mode 
WHERE dashboard_view_mode IS NOT NULL 
  AND dashboard_view_mode IN ('nodes', 'tiles');

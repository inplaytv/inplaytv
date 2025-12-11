-- ===================================================================
-- SITE MAINTENANCE MODE SYSTEM
-- ===================================================================
-- Allows admins to toggle between different maintenance states

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
CREATE POLICY "Anyone can view site settings"
ON site_settings
FOR SELECT
USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Only admins can modify settings" ON site_settings;
CREATE POLICY "Only admins can modify settings"
ON site_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- Insert default maintenance mode setting
-- Modes: 'live', 'coming-soon', 'maintenance'
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('maintenance_mode', 'live')
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = 'live';

-- Create index
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(setting_key);

-- Show current settings
SELECT 
  '✅ Site settings table created!' as status,
  setting_key,
  setting_value,
  updated_at
FROM public.site_settings;

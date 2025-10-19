-- ===================================================================
-- ADMIN SETTINGS TABLE
-- Run this in Supabase Dashboard SQL Editor
-- ===================================================================

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "admin_settings_public_read" ON public.admin_settings;
CREATE POLICY "admin_settings_public_read"
  ON public.admin_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin_settings_admin_all" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_all"
  ON public.admin_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('default_admin_fee_percent', '10.00', 'Default admin fee percentage for new competitions')
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.admin_settings IS 'Global admin settings for the platform';

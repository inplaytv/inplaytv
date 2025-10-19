-- ===================================================================
-- COMPETITION TYPES TABLE (Master List)
-- Run this in Supabase Dashboard SQL Editor
-- ===================================================================

-- Create competition_types table (master template list)
CREATE TABLE IF NOT EXISTS public.competition_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competition_types_slug ON public.competition_types(slug);

-- Enable RLS
ALTER TABLE public.competition_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "competition_types_public_read" ON public.competition_types;
CREATE POLICY "competition_types_public_read"
  ON public.competition_types
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "competition_types_admin_all" ON public.competition_types;
CREATE POLICY "competition_types_admin_all"
  ON public.competition_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS competition_types_updated_at ON public.competition_types;
CREATE TRIGGER competition_types_updated_at
  BEFORE UPDATE ON public.competition_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.competition_types IS 'Master list of competition type templates (Full Course, Round 1-4, etc.)';

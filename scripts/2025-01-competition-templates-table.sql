-- ===================================================================
-- COMPETITION TEMPLATES TABLE
-- Run this in Supabase Dashboard SQL Editor
-- Create reusable competition configuration templates
-- ===================================================================

-- Create competition_templates table
CREATE TABLE IF NOT EXISTS public.competition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  competition_type_id UUID NOT NULL REFERENCES public.competition_types(id) ON DELETE CASCADE,
  entry_fee_pennies INTEGER NOT NULL DEFAULT 0 CHECK (entry_fee_pennies >= 0),
  entrants_cap INTEGER NOT NULL DEFAULT 0 CHECK (entrants_cap >= 0),
  admin_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (admin_fee_percent >= 0 AND admin_fee_percent <= 100),
  reg_open_days_before INTEGER DEFAULT NULL CHECK (reg_open_days_before >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competition_templates_type ON public.competition_templates(competition_type_id);

-- Enable RLS
ALTER TABLE public.competition_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "competition_templates_public_read" ON public.competition_templates;
CREATE POLICY "competition_templates_public_read"
  ON public.competition_templates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "competition_templates_admin_all" ON public.competition_templates;
CREATE POLICY "competition_templates_admin_all"
  ON public.competition_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS competition_templates_updated_at ON public.competition_templates;
CREATE TRIGGER competition_templates_updated_at
  BEFORE UPDATE ON public.competition_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.competition_templates IS 'Reusable competition configuration templates. Multiple templates can exist for the same competition type with different fees and settings (e.g., Full Course - Free, Full Course - £10, Full Course - £50).';

-- Insert example templates
INSERT INTO public.competition_templates (name, description, competition_type_id, entry_fee_pennies, entrants_cap, admin_fee_percent, reg_open_days_before)
SELECT 
  'Full Course - Free Entry',
  'Free entry competition for practice rounds',
  ct.id,
  0,
  0,
  0.00,
  14
FROM public.competition_types ct WHERE ct.slug = 'full-course' LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.competition_templates (name, description, competition_type_id, entry_fee_pennies, entrants_cap, admin_fee_percent, reg_open_days_before)
SELECT 
  'Full Course - Economy (£10)',
  'Economy entry level competition',
  ct.id,
  1000,
  0,
  10.00,
  7
FROM public.competition_types ct WHERE ct.slug = 'full-course' LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.competition_templates (name, description, competition_type_id, entry_fee_pennies, entrants_cap, admin_fee_percent, reg_open_days_before)
SELECT 
  'Full Course - Standard (£50)',
  'Standard competition with 8% admin fee',
  ct.id,
  5000,
  0,
  8.00,
  5
FROM public.competition_types ct WHERE ct.slug = 'full-course' LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.competition_templates (name, description, competition_type_id, entry_fee_pennies, entrants_cap, admin_fee_percent, reg_open_days_before)
SELECT 
  'Full Course - Premium (£100)',
  'Premium competition with 5% admin fee',
  ct.id,
  10000,
  0,
  5.00,
  3
FROM public.competition_types ct WHERE ct.slug = 'full-course' LIMIT 1
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- ADD TEMPLATE FIELDS TO COMPETITION TYPES
-- Run this in Supabase Dashboard SQL Editor
-- Adds optional template defaults for competition types
-- ===================================================================

-- Add template fields to competition_types
ALTER TABLE public.competition_types 
ADD COLUMN IF NOT EXISTS default_entry_fee_pennies INTEGER DEFAULT NULL CHECK (default_entry_fee_pennies >= 0),
ADD COLUMN IF NOT EXISTS default_entrants_cap INTEGER DEFAULT NULL CHECK (default_entrants_cap >= 0),
ADD COLUMN IF NOT EXISTS default_admin_fee_percent DECIMAL(5,2) DEFAULT NULL CHECK (default_admin_fee_percent >= 0 AND default_admin_fee_percent <= 100),
ADD COLUMN IF NOT EXISTS default_reg_open_days_before INTEGER DEFAULT NULL CHECK (default_reg_open_days_before >= 0),
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN public.competition_types.default_entry_fee_pennies IS 'Template default entry fee in pennies (optional)';
COMMENT ON COLUMN public.competition_types.default_entrants_cap IS 'Template default entrants cap (optional, 0 = unlimited)';
COMMENT ON COLUMN public.competition_types.default_admin_fee_percent IS 'Template default admin fee percentage (optional)';
COMMENT ON COLUMN public.competition_types.default_reg_open_days_before IS 'Template: how many days before tournament start should registration open (optional)';
COMMENT ON COLUMN public.competition_types.is_template IS 'Whether this competition type has pre-configured template values';

-- Update the table comment
COMMENT ON TABLE public.competition_types IS 'Master list of competition type templates (Full Course, Round 1-4, etc.). Can include optional default values that pre-populate when adding to tournaments.';

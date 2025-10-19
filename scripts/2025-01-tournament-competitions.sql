-- ===================================================================
-- TOURNAMENT COMPETITIONS TABLE (Instances)
-- Run this in Supabase Dashboard SQL Editor AFTER running the two previous migrations
-- ===================================================================

-- Create tournament_competitions table (specific instances per tournament)
CREATE TABLE IF NOT EXISTS public.tournament_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  competition_type_id UUID NOT NULL REFERENCES public.competition_types(id) ON DELETE CASCADE,
  entry_fee_pennies INTEGER NOT NULL DEFAULT 0 CHECK (entry_fee_pennies >= 0),
  entrants_cap INTEGER NOT NULL DEFAULT 0 CHECK (entrants_cap >= 0),
  admin_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (admin_fee_percent >= 0 AND admin_fee_percent <= 100),
  reg_open_at TIMESTAMPTZ,
  reg_close_at TIMESTAMPTZ,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'reg_open', 'reg_closed', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, competition_type_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournament_competitions_tournament ON public.tournament_competitions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_competitions_type ON public.tournament_competitions(competition_type_id);
CREATE INDEX IF NOT EXISTS idx_tournament_competitions_status ON public.tournament_competitions(status);

-- Enable RLS
ALTER TABLE public.tournament_competitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "tournament_competitions_public_read" ON public.tournament_competitions;
CREATE POLICY "tournament_competitions_public_read"
  ON public.tournament_competitions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tournament_competitions_admin_all" ON public.tournament_competitions;
CREATE POLICY "tournament_competitions_admin_all"
  ON public.tournament_competitions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create function to auto-set reg_close_at to 15 minutes before start_at
CREATE OR REPLACE FUNCTION public.auto_set_reg_close_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If start_at is set and reg_close_at is NULL, auto-calculate it
  -- Allow manual override by checking if reg_close_at was explicitly set
  IF NEW.start_at IS NOT NULL AND NEW.reg_close_at IS NULL THEN
    NEW.reg_close_at := NEW.start_at - INTERVAL '15 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate reg_close_at
DROP TRIGGER IF EXISTS tournament_competitions_auto_reg_close ON public.tournament_competitions;
CREATE TRIGGER tournament_competitions_auto_reg_close
  BEFORE INSERT OR UPDATE ON public.tournament_competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_reg_close_at();

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS tournament_competitions_updated_at ON public.tournament_competitions;
CREATE TRIGGER tournament_competitions_updated_at
  BEFORE UPDATE ON public.tournament_competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.tournament_competitions IS 'Competition instances linking tournaments to competition types with specific fees and caps. Registration closes automatically 15 minutes before start time unless manually overridden.';

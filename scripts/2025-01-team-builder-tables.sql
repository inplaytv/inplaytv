-- ===================================================================
-- TEAM BUILDER SYSTEM - User Team Selections
-- Run this in Supabase Dashboard SQL Editor
-- Creates tables for storing user's team selections/picks
-- ===================================================================

-- ===================================================================
-- 1. ADD SALARY TO COMPETITION GOLFERS
-- ===================================================================
-- Add salary column to competition_golfers so each competition can have 
-- different salaries for the same golfer
ALTER TABLE public.competition_golfers 
ADD COLUMN IF NOT EXISTS salary INTEGER DEFAULT 5000 CHECK (salary >= 0);

-- Add index for salary filtering
CREATE INDEX IF NOT EXISTS idx_competition_golfers_salary ON public.competition_golfers(salary);

COMMENT ON COLUMN public.competition_golfers.salary IS 'Fantasy salary for this golfer in this specific competition (in pounds)';

-- ===================================================================
-- 2. COMPETITION ENTRIES TABLE
-- ===================================================================
-- Links users to competitions they've entered (replaces generic entries table for competitions)
CREATE TABLE IF NOT EXISTS public.competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.tournament_competitions(id) ON DELETE CASCADE,
  entry_name TEXT, -- Optional name for their team like "Tiger's Revenge"
  total_salary INTEGER NOT NULL DEFAULT 0 CHECK (total_salary >= 0),
  entry_fee_paid INTEGER NOT NULL DEFAULT 0, -- Amount paid in pennies
  captain_golfer_id UUID REFERENCES public.golfers(id), -- Which golfer is captain (2x points)
  status TEXT CHECK (status IN ('draft', 'submitted', 'paid', 'cancelled')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(user_id, competition_id) -- One entry per user per competition
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competition_entries_user ON public.competition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_competition ON public.competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_status ON public.competition_entries(status);

-- ===================================================================
-- 3. ENTRY PICKS TABLE (User's selected golfers)
-- ===================================================================
-- Links specific golfers to entries - this is the user's team
CREATE TABLE IF NOT EXISTS public.entry_picks (
  entry_id UUID NOT NULL REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES public.golfers(id) ON DELETE CASCADE,
  slot_position INTEGER NOT NULL CHECK (slot_position >= 1 AND slot_position <= 6),
  salary_at_selection INTEGER NOT NULL, -- Salary when they picked (frozen)
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (entry_id, golfer_id),
  UNIQUE(entry_id, slot_position) -- One golfer per slot
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entry_picks_entry ON public.entry_picks(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_picks_golfer ON public.entry_picks(golfer_id);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Enable RLS
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_picks ENABLE ROW LEVEL SECURITY;

-- Competition Entries: Users can read/write their own entries
CREATE POLICY "Users can view their own competition entries"
  ON public.competition_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competition entries"
  ON public.competition_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft entries"
  ON public.competition_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- Entry Picks: Users can manage picks for their own entries
CREATE POLICY "Users can view picks for their own entries"
  ON public.entry_picks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_entries ce
      WHERE ce.id = entry_picks.entry_id
      AND ce.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add picks to their own entries"
  ON public.entry_picks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competition_entries ce
      WHERE ce.id = entry_picks.entry_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'draft'
    )
  );

CREATE POLICY "Users can delete picks from their own draft entries"
  ON public.entry_picks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_entries ce
      WHERE ce.id = entry_picks.entry_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'draft'
    )
  );

-- ===================================================================
-- HELPER VIEWS
-- ===================================================================

-- View: Complete entry with all picks
CREATE OR REPLACE VIEW public.v_entry_teams AS
SELECT 
  ce.id AS entry_id,
  ce.user_id,
  ce.competition_id,
  ce.entry_name,
  ce.total_salary,
  ce.entry_fee_paid,
  ce.captain_golfer_id,
  ce.status AS entry_status,
  ce.created_at,
  ce.submitted_at,
  g.id AS golfer_id,
  g.full_name AS golfer_name,
  g.image_url AS golfer_image,
  g.world_ranking,
  ep.slot_position,
  ep.salary_at_selection,
  (g.id = ce.captain_golfer_id) AS is_captain
FROM public.competition_entries ce
LEFT JOIN public.entry_picks ep ON ce.id = ep.entry_id
LEFT JOIN public.golfers g ON ep.golfer_id = g.id
ORDER BY ce.created_at DESC, ep.slot_position ASC;

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE public.competition_entries IS 'User entries for specific competitions. One entry per user per competition.';
COMMENT ON TABLE public.entry_picks IS 'Golfer selections for each entry. Users pick 6 golfers within salary cap.';

COMMENT ON COLUMN public.competition_entries.captain_golfer_id IS 'Captain earns 2x points. Must be one of the 6 selected golfers.';
COMMENT ON COLUMN public.competition_entries.total_salary IS 'Sum of all selected golfer salaries. Must be <= competition salary cap (typically £50,000).';
COMMENT ON COLUMN public.competition_entries.status IS 'draft=building team, submitted=ready, paid=payment confirmed, cancelled=withdrawn';
COMMENT ON COLUMN public.entry_picks.salary_at_selection IS 'Frozen salary when picked - protects against price changes after selection';

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Team Builder tables created successfully!';
  RAISE NOTICE '📊 Tables: competition_entries, entry_picks';
  RAISE NOTICE '🎯 Next: Build the Team Builder frontend page';
END $$;

-- ===================================================================
-- ADD ROUND START TIMES TO TOURNAMENTS
-- Required for ONE 2 ONE registration deadlines
-- ===================================================================

-- Add round start timestamp columns
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS round_1_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round_2_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round_3_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round_4_start TIMESTAMPTZ;

-- Add current_round column if it doesn't exist
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0 CHECK (current_round >= 0 AND current_round <= 4);

-- Add indexes for round start times (used for registration deadline queries)
CREATE INDEX IF NOT EXISTS idx_tournaments_round_1_start ON public.tournaments(round_1_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_round_2_start ON public.tournaments(round_2_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_round_3_start ON public.tournaments(round_3_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_round_4_start ON public.tournaments(round_4_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_current_round ON public.tournaments(current_round);

COMMENT ON COLUMN public.tournaments.round_1_start IS 'When Round 1 starts - used for ONE 2 ONE registration deadlines';
COMMENT ON COLUMN public.tournaments.round_2_start IS 'When Round 2 starts - used for ONE 2 ONE registration deadlines';
COMMENT ON COLUMN public.tournaments.round_3_start IS 'When Round 3 starts - used for ONE 2 ONE registration deadlines';
COMMENT ON COLUMN public.tournaments.round_4_start IS 'When Round 4 starts - used for ONE 2 ONE registration deadlines';
COMMENT ON COLUMN public.tournaments.current_round IS '0=Not started, 1-4=Round in progress, NULL=Completed';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tournaments'
  AND column_name LIKE 'round_%'
ORDER BY column_name;

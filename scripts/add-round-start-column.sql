-- Add round_start column to competition_types table
-- This indicates which round the competition starts (and when registration closes)

ALTER TABLE public.competition_types 
ADD COLUMN IF NOT EXISTS round_start INTEGER DEFAULT 1;

COMMENT ON COLUMN public.competition_types.round_start IS 'Which round this competition starts on (1-4). Registration closes at 6:30 AM on this round day.';

-- Update existing competition types with their round_start values
UPDATE public.competition_types SET round_start = 1 WHERE slug IN ('full-course', 'one-2-one', 'first-strike', 'beat-the-cut');
UPDATE public.competition_types SET round_start = 3 WHERE slug = 'the-weekender';
UPDATE public.competition_types SET round_start = 4 WHERE slug = 'final-strike';

-- Verify the updates
SELECT 
  name,
  slug,
  round_start,
  CASE round_start
    WHEN 1 THEN 'Registration closes at start of Round 1'
    WHEN 2 THEN 'Registration closes at start of Round 2'
    WHEN 3 THEN 'Registration closes at start of Round 3'
    WHEN 4 THEN 'Registration closes at start of Round 4'
    ELSE 'Not set'
  END as registration_timing
FROM public.competition_types
ORDER BY round_start, name;

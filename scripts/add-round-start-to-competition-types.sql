-- ===================================================================
-- ADD ROUND START TO COMPETITION TYPES
-- Enables round-based registration timing
-- ===================================================================

-- Step 1: Add round_start column
ALTER TABLE public.competition_types 
ADD COLUMN IF NOT EXISTS round_start INTEGER DEFAULT 1;

-- Step 2: Set round_start for each competition type
-- (Registration closes at 6:30 AM on the day this round starts)

-- Round 1 competitions (close at 6:30 AM on tournament start day)
UPDATE public.competition_types 
SET round_start = 1 
WHERE name IN ('Full Course', 'ONE 2 ONE', 'First To Strike', 'Beat The Cut');

-- Round 2 competitions (close at 6:30 AM on day 2)
UPDATE public.competition_types 
SET round_start = 2 
WHERE name = 'Second Round';

-- Round 3 competitions (close at 6:30 AM on day 3)
UPDATE public.competition_types 
SET round_start = 3 
WHERE name = 'THE WEEKENDER';

-- Round 4 competitions (close at 6:30 AM on final day)
UPDATE public.competition_types 
SET round_start = 4 
WHERE name = 'Final Strike';

-- Step 3: Verify the updates
SELECT 
  name,
  rounds_count,
  round_start,
  CASE 
    WHEN round_start = 1 THEN 'Closes before tournament starts'
    WHEN round_start = 2 THEN 'Closes before Round 2 (Day 2)'
    WHEN round_start = 3 THEN 'Closes before Round 3 (Day 3)'
    WHEN round_start = 4 THEN 'Closes before Round 4 (Final Day)'
  END as registration_timing
FROM public.competition_types
ORDER BY round_start, name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Round-based registration system installed!';
  RAISE NOTICE '📝 Competition registration will now close at the start of their designated round';
  RAISE NOTICE '🔄 Next: Update create-tournament API to calculate reg_close_at based on round_start';
END;
$$;

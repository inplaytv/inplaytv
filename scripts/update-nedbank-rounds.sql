-- ===================================================================
-- UPDATE NEDBANK TOURNAMENT ROUND TIMES
-- Set round start times for existing tournament
-- ===================================================================

-- Update Nedbank tournament with round start times
-- Adjust these timestamps based on actual tournament schedule
UPDATE public.tournaments
SET 
  current_round = 2, -- Currently in Round 2
  round_1_start = start_date + INTERVAL '0 hours', -- Round 1 started at tournament start
  round_2_start = start_date + INTERVAL '24 hours', -- Day 2
  round_3_start = start_date + INTERVAL '48 hours', -- Day 3
  round_4_start = start_date + INTERVAL '72 hours', -- Day 4
  updated_at = NOW()
WHERE slug = 'nedbank-golf-challenge-in-honour-of-gary-player';

-- Verify the update
SELECT 
  name,
  slug,
  start_date,
  current_round,
  round_1_start,
  round_2_start,
  round_3_start,
  round_4_start,
  NOW() as current_time,
  CASE 
    WHEN NOW() >= round_1_start THEN 'ONE 2 ONE All Rounds SHOULD BE CLOSED'
    ELSE 'ONE 2 ONE All Rounds should be open'
  END as expected_status
FROM public.tournaments
WHERE slug = 'nedbank-golf-challenge-in-honour-of-gary-player';

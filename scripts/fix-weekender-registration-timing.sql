-- ===================================================================
-- FIX THE WEEKENDER AND FINAL STRIKE REGISTRATION TIMING
-- Both competitions use only players who made the cut after Round 2
-- Therefore, registration must open AFTER Round 2 ends (when cut is determined)
-- ===================================================================

-- THE WEEKENDER should:
-- - Open: When Round 2 ENDS (cut is determined) = round_2_start + 1 day
-- - Close: When Round 3 STARTS = round_3_start
-- 
-- FINAL STRIKE should:
-- - Open: When Round 2 ENDS (cut is determined) = round_2_start + 1 day
-- - Close: When Round 4 STARTS = round_4_start

-- Update Nedbank Golf Challenge - THE WEEKENDER
UPDATE tournament_competitions tc
SET 
  reg_open_at = t.round_2_start + INTERVAL '1 day',  -- Round 2 end time
  reg_close_at = t.round_3_start,  -- Round 3 start time
  updated_at = NOW()
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND t.slug = 'nedbank-golf-challenge-in-honour-of-gary-player'
  AND tc.competition_type_id = (SELECT id FROM competition_types WHERE name = 'THE WEEKENDER');

-- Update Nedbank Golf Challenge - FINAL STRIKE
UPDATE tournament_competitions tc
SET 
  reg_open_at = t.round_2_start + INTERVAL '1 day',  -- Round 2 end time
  reg_close_at = t.round_4_start,  -- Round 4 start time
  updated_at = NOW()
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND t.slug = 'nedbank-golf-challenge-in-honour-of-gary-player'
  AND tc.competition_type_id = (SELECT id FROM competition_types WHERE name = 'Final Strike');

-- Update Hero World Challenge - THE WEEKENDER
UPDATE tournament_competitions tc
SET 
  reg_open_at = t.round_2_start + INTERVAL '1 day',
  reg_close_at = t.round_3_start,
  updated_at = NOW()
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND t.slug = 'hero-world-challenge'
  AND tc.competition_type_id = (SELECT id FROM competition_types WHERE name = 'THE WEEKENDER');

-- Update Hero World Challenge - FINAL STRIKE
UPDATE tournament_competitions tc
SET 
  reg_open_at = t.round_2_start + INTERVAL '1 day',
  reg_close_at = t.round_4_start,
  updated_at = NOW()
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND t.slug = 'hero-world-challenge'
  AND tc.competition_type_id = (SELECT id FROM competition_types WHERE name = 'Final Strike');

-- Update Crown Australian Open - THE WEEKENDER
UPDATE tournament_competitions tc
SET 
  reg_open_at = t.round_2_start + INTERVAL '1 day',
  reg_close_at = t.round_3_start,
  updated_at = NOW()
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND t.slug = 'crown-australian-open'
  AND tc.competition_type_id = (SELECT id FROM competition_types WHERE name = 'THE WEEKENDER');

-- Update Crown Australian Open - FINAL STRIKE
UPDATE tournament_competitions tc
SET 
  reg_open_at = t.round_2_start + INTERVAL '1 day',
  reg_close_at = t.round_4_start,
  updated_at = NOW()
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND t.slug = 'crown-australian-open'
  AND tc.competition_type_id = (SELECT id FROM competition_types WHERE name = 'Final Strike');

-- Verify the changes
SELECT 
  t.name as tournament,
  ct.name as competition,
  t.round_2_start + INTERVAL '1 day' as round_2_end,
  tc.reg_open_at,
  tc.reg_close_at,
  CASE 
    WHEN ct.name = 'THE WEEKENDER' THEN t.round_3_start
    WHEN ct.name = 'Final Strike' THEN t.round_4_start
  END as expected_close,
  NOW() as current_time,
  CASE 
    WHEN NOW() < tc.reg_open_at THEN 'Registration Not Yet Open (Waiting for R2 to complete)'
    WHEN NOW() >= tc.reg_open_at AND NOW() < tc.reg_close_at THEN 'Registration OPEN'
    ELSE 'Registration Closed'
  END as status
FROM tournaments t
JOIN tournament_competitions tc ON t.id = tc.tournament_id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE ct.name IN ('THE WEEKENDER', 'Final Strike')
ORDER BY t.name, ct.name;

-- ===================================================================
-- FIX: Tournament Competition Registration Close Times
-- Sets reg_close_at to 15 minutes before the appropriate round start
-- ===================================================================

-- First, let's see the current situation for ALL tournaments
SELECT 
  t.name as tournament,
  t.slug,
  ct.name as competition_type,
  tc.reg_open_at,
  tc.reg_close_at,
  tc.status,
  t.round_1_start,
  t.round_2_start,
  t.round_3_start,
  t.round_4_start,
  t.current_round
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.status NOT IN ('completed', 'cancelled')
ORDER BY t.name, ct.name;

-- ===================================================================
-- FIX 1: FINAL STRIKE - Close 15 minutes before Round 4
-- ===================================================================
UPDATE tournament_competitions tc
SET 
  reg_close_at = t.round_4_start - INTERVAL '15 minutes',
  updated_at = NOW()
FROM tournaments t
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = t.id
  AND ct.slug = 'final-strike'
  AND t.round_4_start IS NOT NULL
  AND t.status NOT IN ('completed', 'cancelled');

-- ===================================================================
-- FIX 2: FIRST TO STRIKE - Close 15 minutes before Round 1
-- ===================================================================
UPDATE tournament_competitions tc
SET 
  reg_close_at = t.round_1_start - INTERVAL '15 minutes',
  updated_at = NOW()
FROM tournaments t
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = t.id
  AND ct.slug = 'first-to-strike'
  AND t.round_1_start IS NOT NULL
  AND t.status NOT IN ('completed', 'cancelled');

-- ===================================================================
-- FIX 3: THE WEEKENDER - Close 15 minutes before Round 3
-- (Typically covers rounds 3-4, so closes before round 3)
-- ===================================================================
UPDATE tournament_competitions tc
SET 
  reg_close_at = t.round_3_start - INTERVAL '15 minutes',
  updated_at = NOW()
FROM tournaments t
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = t.id
  AND ct.slug = 'the-weekender'
  AND t.round_3_start IS NOT NULL
  AND t.status NOT IN ('completed', 'cancelled');

-- ===================================================================
-- FIX 4: BEAT THE CUT - Close 15 minutes before Round 1
-- (Needs to close before tournament starts, result determined after R2)
-- ===================================================================
UPDATE tournament_competitions tc
SET 
  reg_close_at = t.round_1_start - INTERVAL '15 minutes',
  updated_at = NOW()
FROM tournaments t
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = t.id
  AND ct.slug = 'beat-the-cut'
  AND t.round_1_start IS NOT NULL
  AND t.status NOT IN ('completed', 'cancelled');

-- ===================================================================
-- FIX 5: FULL COURSE - Close 15 minutes before Round 1
-- (Covers all rounds, so closes before first round)
-- ===================================================================
UPDATE tournament_competitions tc
SET 
  reg_close_at = t.round_1_start - INTERVAL '15 minutes',
  updated_at = NOW()
FROM tournaments t
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = t.id
  AND ct.slug = 'full-course'
  AND t.round_1_start IS NOT NULL
  AND t.status NOT IN ('completed', 'cancelled');

-- ===================================================================
-- VERIFY: Check the updated times
-- ===================================================================
SELECT 
  t.name as tournament,
  ct.name as competition_type,
  tc.reg_open_at,
  tc.reg_close_at,
  tc.status,
  CASE ct.slug
    WHEN 'final-strike' THEN t.round_4_start
    WHEN 'first-to-strike' THEN t.round_1_start
    WHEN 'the-weekender' THEN t.round_3_start
    WHEN 'beat-the-cut' THEN t.round_1_start
    WHEN 'full-course' THEN t.round_1_start
  END as relevant_round_start,
  EXTRACT(EPOCH FROM (
    CASE ct.slug
      WHEN 'final-strike' THEN t.round_4_start
      WHEN 'first-to-strike' THEN t.round_1_start
      WHEN 'the-weekender' THEN t.round_3_start
      WHEN 'beat-the-cut' THEN t.round_1_start
      WHEN 'full-course' THEN t.round_1_start
    END - tc.reg_close_at
  ))/60 as minutes_before_start,
  tc.reg_close_at < NOW() as is_closed,
  NOW() as current_time
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.status NOT IN ('completed', 'cancelled')
ORDER BY t.name, ct.name;

-- ===================================================================
-- Specifically check Nedbank tournament
-- ===================================================================
SELECT 
  'Nedbank Results' as query_name,
  ct.name as competition_type,
  tc.reg_open_at,
  tc.reg_close_at,
  tc.status,
  t.round_4_start,
  EXTRACT(EPOCH FROM (t.round_4_start - tc.reg_close_at))/60 as minutes_before_round4
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.slug = 'nedbank-golf-challenge-in-honour-of-gary-player'
ORDER BY ct.name;

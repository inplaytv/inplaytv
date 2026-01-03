-- Fix THE GREENIDGE OPEN - 4-day tournament starting TOMORROW (Jan 2-5, 2026)
-- Today is Jan 1, so tournament starts in 1 day

-- Update tournament dates and round tee times (4 consecutive days)
UPDATE tournaments
SET 
  start_date = '2026-01-02 06:20:00+00',
  end_date = '2026-01-05 18:00:00+00',
  registration_opens_at = '2025-12-26 06:00:00+00',
  registration_closes_at = '2026-01-05 06:05:00+00',
  round_1_start = '2026-01-02 06:20:00+00',
  round_2_start = '2026-01-03 06:20:00+00',
  round_3_start = '2026-01-04 06:20:00+00',
  round_4_start = '2026-01-05 06:20:00+00',
  updated_at = NOW()
WHERE slug = 'the-greenidge-open';

-- Full Course, Beat The Cut, First To Strike: Close 15min before Round 1
UPDATE tournament_competitions
SET 
  reg_open_at = '2025-12-26 06:00:00+00',
  reg_close_at = '2026-01-02 06:05:00+00',
  start_at = '2026-01-02 06:20:00+00',
  end_at = '2026-01-05 18:00:00+00',
  status = 'registration_open',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'the-greenidge-open')
  AND competition_type_id IN (
    SELECT id FROM competition_types WHERE slug IN ('full-course', 'beat-the-cut', 'first-strike')
  )
  AND competition_format = 'inplay';

-- Second Round: Closes 15min before Round 2
UPDATE tournament_competitions
SET 
  reg_open_at = '2025-12-26 06:00:00+00',
  reg_close_at = '2026-01-03 06:05:00+00',
  start_at = '2026-01-03 06:20:00+00',
  end_at = '2026-01-05 18:00:00+00',
  status = 'registration_open',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'the-greenidge-open')
  AND competition_type_id IN (
    SELECT id FROM competition_types WHERE slug = 'second-round'
  )
  AND competition_format = 'inplay';

-- THE WEEKENDER, Third Round: Close 15min before Round 3
UPDATE tournament_competitions
SET 
  reg_open_at = '2025-12-26 06:00:00+00',
  reg_close_at = '2026-01-04 06:05:00+00',
  start_at = '2026-01-04 06:20:00+00',
  end_at = '2026-01-05 18:00:00+00',
  status = 'registration_open',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'the-greenidge-open')
  AND competition_type_id IN (
    SELECT id FROM competition_types WHERE slug IN ('the-weekender', 'third-round')
  )
  AND competition_format = 'inplay';

-- Final Strike: Closes 15min before Round 4
UPDATE tournament_competitions
SET 
  reg_open_at = '2025-12-26 06:00:00+00',
  reg_close_at = '2026-01-05 06:05:00+00',
  start_at = '2026-01-05 06:20:00+00',
  end_at = '2026-01-05 18:00:00+00',
  status = 'registration_open',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'the-greenidge-open')
  AND competition_type_id IN (
    SELECT id FROM competition_types WHERE slug = 'final-strike'
  )
  AND competition_format = 'inplay';

-- Verify the changes
SELECT 
  t.name,
  t.registration_closes_at as tournament_reg_close,
  tc.status,
  ct.name as competition_name,
  tc.reg_close_at as comp_reg_close
FROM tournaments t
LEFT JOIN tournament_competitions tc ON tc.tournament_id = t.id
LEFT JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE t.slug = 'the-greenidge-open'
  AND tc.competition_format = 'inplay'
ORDER BY ct.name;

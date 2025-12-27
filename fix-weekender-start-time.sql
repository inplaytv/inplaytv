-- Fix THE WEEKENDER and Third Round - they should use round_3_start, not round_1_start
-- This updates their start_at and recalculates reg_close_at (15 min before start)

UPDATE tournament_competitions tc
SET 
  start_at = t.round_3_start,
  reg_close_at = t.round_3_start - INTERVAL '15 minutes',
  end_at = t.end_date + INTERVAL '23 hours 59 minutes'
FROM tournaments t
WHERE tc.tournament_id = t.id
AND t.name = 'Mister G''s Open'
AND tc.competition_type_id IN (
  SELECT id FROM competition_types WHERE name IN ('THE WEEKENDER', 'Third Round')
)
AND t.round_3_start IS NOT NULL;

-- Verify the fix
SELECT 
  t.name AS tournament,
  ct.name AS competition,
  tc.status,
  t.round_3_start AS lifecycle_round3,
  tc.start_at AS comp_start,
  tc.reg_close_at AS comp_reg_close,
  NOW() as current_time,
  CASE 
    WHEN tc.start_at = t.round_3_start THEN '✅ FIXED'
    ELSE '❌ STILL WRONG'
  END as fix_status
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.name = 'Mister G''s Open'
AND ct.name IN ('THE WEEKENDER', 'Third Round');

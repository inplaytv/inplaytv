-- Update PGA Q-School competitions to registration open status
-- Run this in Supabase SQL Editor

UPDATE tournament_competitions
SET 
  status = 'reg_open',
  reg_close_at = NOW() + INTERVAL '7 days',
  start_at = NOW() + INTERVAL '7 days'
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE slug LIKE '%q-school%'
);

-- Verify it worked
SELECT 
  t.name as tournament_name,
  ct.name as competition_name,
  tc.status,
  tc.reg_close_at,
  tc.start_at
FROM tournament_competitions tc
JOIN competition_types ct ON tc.competition_type_id = ct.id
JOIN tournaments t ON tc.tournament_id = t.id
WHERE t.slug LIKE '%q-school%'
ORDER BY ct.name;

-- SIMPLE FIX: Update Alfred Dunhill registration times
-- Run this in Supabase SQL Editor

UPDATE tournament_competitions
SET 
  reg_close_at = NOW() + INTERVAL '48 hours',
  start_at = NOW() + INTERVAL '48 hours'
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE slug = 'alfred-dunhill-championship-2024'
);

-- Verify it worked
SELECT 
  ct.name,
  tc.status,
  tc.reg_close_at,
  tc.reg_close_at > NOW() as "is_open"
FROM tournament_competitions tc
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = (
  SELECT id FROM tournaments WHERE slug = 'alfred-dunhill-championship-2024'
)
ORDER BY ct.name;

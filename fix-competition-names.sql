-- Fix competition names being NULL
-- Competitions should have names based on their competition_type

UPDATE tournament_competitions tc
SET name = COALESCE(
  ct.name,
  CASE 
    WHEN tc.competition_format = 'one2one' THEN 'ONE 2 ONE Challenge'
    ELSE 'Competition'
  END
)
FROM competition_types ct
WHERE tc.competition_type_id = ct.id
  AND tc.name IS NULL;

-- Fix any remaining NULL names for ONE 2 ONE challenges
UPDATE tournament_competitions
SET name = 'ONE 2 ONE Challenge'
WHERE name IS NULL
  AND competition_format = 'one2one';

-- Check results
SELECT 
  t.name as tournament,
  tc.name as competition_name,
  tc.competition_format,
  tc.status,
  (SELECT COUNT(*) FROM competition_entries WHERE competition_id = tc.id) as entry_count
FROM tournament_competitions tc
JOIN tournaments t ON t.id = tc.tournament_id
ORDER BY t.name, tc.created_at;

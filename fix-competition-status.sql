-- Update THE GREENIDGE OPEN competitions from draft to reg_open status
UPDATE tournament_competitions 
SET status = 'reg_open' 
WHERE tournament_id = '843e4121-7e22-48c0-a7f3-fcffe96982d5';

-- Verify the update
SELECT 
  tc.id,
  ct.name as competition_name,
  tc.status,
  tc.competition_format
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = '843e4121-7e22-48c0-a7f3-fcffe96982d5'
ORDER BY ct.name;

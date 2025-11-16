-- Check the actual competition_entries record
SELECT 
  id,
  user_id,
  competition_id,
  entry_name,
  total_salary,
  entry_fee_paid,
  captain_golfer_id,
  status,
  created_at,
  submitted_at
FROM competition_entries
WHERE id = '9a5f0e14-f95d-4fda-970d-faac0a5845c3';

-- Also check what competition this is
SELECT 
  tc.id,
  tc.tournament_id,
  t.name as tournament_name,
  ct.name as competition_type
FROM tournament_competitions tc
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.id = (
  SELECT competition_id 
  FROM competition_entries 
  WHERE id = '9a5f0e14-f95d-4fda-970d-faac0a5845c3'
);

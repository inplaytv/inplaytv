-- Check what those 2 entries are
SELECT 
  ce.id as entry_id,
  ce.entry_name,
  ce.competition_id,
  ce.instance_id,
  tc.id as tournament_competition_id,
  t.name as tournament_name,
  ct.name as competition_type_name,
  tc.entry_fee_pennies,
  ce.created_at
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON tc.id = ce.competition_id
LEFT JOIN tournaments t ON t.id = tc.tournament_id
LEFT JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE ce.id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

-- If these are test entries you want to delete:
-- First delete any results that reference these entries
DELETE FROM competition_results 
WHERE winner_entry_id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

-- Then delete the entries
DELETE FROM competition_entries 
WHERE id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

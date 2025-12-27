-- Check which COMPETITIONS don't have golfer groups assigned
SELECT 
  tc.id as competition_id,
  t.name as tournament_name,
  ct.name as competition_name,
  tc.assigned_golfer_group_id
FROM tournament_competitions tc
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.assigned_golfer_group_id IS NULL;

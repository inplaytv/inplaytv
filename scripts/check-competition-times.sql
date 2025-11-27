-- Check the current registration close times
SELECT 
  tc.id,
  ct.name as type_name,
  tc.reg_close_at,
  tc.reg_close_at AT TIME ZONE 'America/New_York' as reg_close_local,
  NOW() AT TIME ZONE 'America/New_York' as current_local,
  tc.reg_close_at > NOW() as is_open,
  tc.status
FROM tournament_competitions tc
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
ORDER BY tc.reg_close_at;

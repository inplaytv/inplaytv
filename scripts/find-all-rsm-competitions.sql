-- Find ALL competitions for RSM Classic
SELECT 
  tc.id,
  ct.name as competition_name,
  ct.slug as competition_slug,
  tc.reg_close_at,
  tc.reg_close_at AT TIME ZONE 'America/New_York' as close_time_est,
  tc.status
FROM tournament_competitions tc
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
ORDER BY tc.reg_close_at;

-- Also check what competition_types exist
SELECT id, name, slug FROM competition_types ORDER BY name;

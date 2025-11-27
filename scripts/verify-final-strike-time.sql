-- Verify Final Strike has correct reg_close_at time
SELECT 
  tc.id,
  ct.name as competition_name,
  tc.reg_close_at,
  tc.reg_close_at AT TIME ZONE 'America/New_York' as close_time_est,
  NOW() AT TIME ZONE 'America/New_York' as current_time_est,
  CASE 
    WHEN tc.reg_close_at > NOW() THEN 'OPEN - Registration closes in ' || 
      EXTRACT(EPOCH FROM (tc.reg_close_at - NOW()))/3600 || ' hours'
    ELSE 'CLOSED'
  END as registration_status,
  tc.status as comp_status
FROM tournament_competitions tc
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
  AND ct.slug = 'final_strike';

-- Check what reg_close_at is actually set to for Final Strike
SELECT 
  id,
  reg_close_at,
  reg_close_at AT TIME ZONE 'America/New_York' as close_time_local,
  NOW() AT TIME ZONE 'America/New_York' as current_time_local,
  status
FROM tournament_competitions
WHERE id = 'fe127a95-2c8f-4165-95dc-da56faff15f8';

-- Update the ACTUAL Final Strike competition (not the type ID!)
UPDATE tournament_competitions
SET 
  reg_close_at = (
    SELECT round4_tee_time - INTERVAL '15 minutes'
    FROM tournaments 
    WHERE id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
  ),
  status = 'reg_open',
  updated_at = NOW()
WHERE id = 'fe127a95-2c8f-4165-95dc-da56faff15f8';

-- Update Final Strike by ID with correct reg_close_at time
UPDATE tournament_competitions
SET 
  reg_close_at = (
    SELECT round4_tee_time - INTERVAL '15 minutes'
    FROM tournaments 
    WHERE id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
  ),
  status = 'open',
  updated_at = NOW()
WHERE id = '01bc3835-75b1-46d0-a334-ff050b570cd8';

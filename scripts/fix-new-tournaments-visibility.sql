-- Check visibility of newly created tournaments
SELECT 
  name,
  status,
  is_visible,
  start_date,
  registration_open_date
FROM tournaments
WHERE name LIKE '%Nedbank%' OR name LIKE '%Crown Australian%'
ORDER BY created_at DESC;

-- Make them visible if they're not
UPDATE tournaments
SET is_visible = true
WHERE (name LIKE '%Nedbank%' OR name LIKE '%Crown Australian%')
  AND is_visible = false;

-- Run auto-update to fix statuses
SELECT * FROM auto_update_tournament_statuses();

-- Verify final state
SELECT 
  name,
  status,
  is_visible,
  start_date,
  registration_open_date,
  NOW() as current_time
FROM tournaments
WHERE name LIKE '%Nedbank%' OR name LIKE '%Crown Australian%'
ORDER BY created_at DESC;

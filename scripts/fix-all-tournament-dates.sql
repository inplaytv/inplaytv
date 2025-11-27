-- Fix ALL tournaments that were added before the registration date columns
-- This ensures every tournament has proper registration dates

-- First, show current state of all non-cancelled tournaments
SELECT 
  name,
  status,
  start_date,
  end_date,
  registration_open_date,
  registration_close_date,
  NOW() as current_time,
  CASE
    WHEN NOW() > end_date THEN 'Should be: COMPLETED'
    WHEN NOW() >= start_date THEN 'Should be: LIVE'
    WHEN NOW() >= (start_date - INTERVAL '15 minutes') THEN 'Should be: REG_CLOSED'
    WHEN NOW() >= (start_date - INTERVAL '10 days') THEN 'Should be: REG_OPEN'
    ELSE 'Should be: UPCOMING'
  END as expected_status
FROM tournaments
WHERE status != 'cancelled'
ORDER BY start_date;

-- Fix ALL tournaments missing registration dates
UPDATE tournaments
SET 
  registration_open_date = start_date - INTERVAL '10 days',
  registration_close_date = start_date - INTERVAL '15 minutes',
  updated_at = NOW()
WHERE registration_open_date IS NULL OR registration_close_date IS NULL;

-- Now manually run the auto-update function to fix statuses
SELECT * FROM auto_update_tournament_statuses();

-- Show final state
SELECT 
  name,
  status,
  start_date,
  end_date,
  registration_open_date,
  registration_close_date,
  NOW() as current_time
FROM tournaments
WHERE status != 'cancelled'
ORDER BY start_date;

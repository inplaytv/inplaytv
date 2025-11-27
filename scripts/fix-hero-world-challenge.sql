-- Fix Hero World Challenge tournament dates
-- This tournament was added before the fix, so it needs registration dates

-- First, let's see the current state
SELECT 
  name,
  status,
  start_date,
  end_date,
  registration_open_date,
  registration_close_date,
  NOW() as current_time
FROM tournaments
WHERE name LIKE '%Hero World%'
ORDER BY start_date DESC
LIMIT 3;

-- Update Hero World Challenge with proper registration dates
UPDATE tournaments
SET 
  registration_open_date = start_date - INTERVAL '10 days',
  registration_close_date = start_date - INTERVAL '15 minutes',
  updated_at = NOW()
WHERE name LIKE '%Hero World%'
  AND start_date >= '2024-12-01'  -- Only recent/upcoming ones
  AND (registration_open_date IS NULL OR registration_close_date IS NULL);

-- Force status update for this tournament
UPDATE tournaments
SET 
  status = CASE
    WHEN NOW() > end_date THEN 'completed'
    WHEN NOW() >= start_date AND NOW() <= end_date THEN 'live'
    WHEN NOW() >= (start_date - INTERVAL '15 minutes') AND NOW() < start_date THEN 'registration_closed'
    WHEN NOW() >= (start_date - INTERVAL '10 days') AND NOW() < (start_date - INTERVAL '15 minutes') THEN 'registration_open'
    ELSE 'upcoming'
  END,
  updated_at = NOW()
WHERE name LIKE '%Hero World%'
  AND start_date >= '2024-12-01';

-- Verify the fix
SELECT 
  name,
  status,
  start_date,
  end_date,
  registration_open_date,
  registration_close_date,
  NOW() as current_time,
  CASE
    WHEN NOW() > end_date THEN '✅ Should be: completed'
    WHEN NOW() >= start_date AND NOW() <= end_date THEN '✅ Should be: live'
    WHEN NOW() >= registration_close_date AND NOW() < start_date THEN '✅ Should be: registration_closed'
    WHEN NOW() >= registration_open_date AND NOW() < registration_close_date THEN '✅ Should be: registration_open'
    ELSE '✅ Should be: upcoming'
  END as expected_status
FROM tournaments
WHERE name LIKE '%Hero World%'
ORDER BY start_date DESC
LIMIT 3;

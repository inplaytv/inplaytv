-- Fix tournament dates from 2024 to 2025 for upcoming tournaments
-- Run this in Supabase SQL Editor

UPDATE tournaments 
SET 
  start_date = '2025-12-04',
  end_date = '2025-12-07',
  updated_at = NOW()
WHERE name = 'Hero World Challenge';

UPDATE tournaments 
SET 
  start_date = '2025-12-04',
  end_date = '2025-12-07',
  updated_at = NOW()
WHERE name LIKE 'Nedbank Golf Challenge%';

-- Check any other tournaments with 2024 dates
SELECT id, name, start_date, end_date, status
FROM tournaments
WHERE EXTRACT(YEAR FROM start_date) = 2024
ORDER BY start_date DESC;
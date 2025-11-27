-- Check Nedbank Golf Challenge status and dates
SELECT 
  name,
  status,
  start_date,
  end_date,
  registration_open_date,
  registration_close_date,
  NOW() as current_time,
  NOW() >= registration_open_date as reg_should_be_open,
  NOW() >= registration_close_date as reg_should_be_closed,
  NOW() >= start_date as should_be_live
FROM tournaments
WHERE name LIKE '%Nedbank%'
ORDER BY created_at DESC
LIMIT 1;

-- Check what the auto-update function would do
SELECT 
  name,
  status as current_status,
  CASE
    WHEN NOW() > end_date THEN 'completed'
    WHEN NOW() >= start_date AND NOW() <= end_date THEN 'live'
    WHEN registration_close_date IS NOT NULL 
      AND NOW() >= registration_close_date 
      AND NOW() < start_date 
      THEN 'registration_closed'
    WHEN registration_open_date IS NOT NULL 
      AND NOW() >= registration_open_date 
      AND (registration_close_date IS NULL OR NOW() < registration_close_date)
      THEN 'registration_open'
    WHEN registration_open_date IS NULL OR NOW() < registration_open_date 
      THEN 'upcoming'
    ELSE status
  END as should_be_status,
  registration_open_date,
  registration_close_date,
  start_date,
  NOW() as current_time
FROM tournaments
WHERE name LIKE '%Nedbank%'
ORDER BY created_at DESC
LIMIT 1;

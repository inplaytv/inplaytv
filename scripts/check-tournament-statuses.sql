-- Check what tournaments exist and their statuses
SELECT 
  name,
  status,
  start_date,
  end_date,
  created_at
FROM tournaments 
WHERE status IN ('upcoming', 'live', 'draft', 'completed')
ORDER BY start_date DESC 
LIMIT 15;

-- Quick diagnostic query to see what status values exist in tournaments table
-- Run this first to see what needs to be fixed

SELECT 
  status,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY start_date DESC) as tournaments
FROM public.tournaments
GROUP BY status
ORDER BY count DESC;

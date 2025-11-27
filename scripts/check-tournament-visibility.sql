-- Check current visibility status of all tournaments
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date,
  created_at
FROM public.tournaments
ORDER BY start_date ASC;

-- Count tournaments by visibility
SELECT 
  is_visible,
  COUNT(*) as count
FROM public.tournaments
GROUP BY is_visible;

-- Check specifically for The Players Championship
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date
FROM public.tournaments
WHERE name ILIKE '%players%championship%';

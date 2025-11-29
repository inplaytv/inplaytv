-- Test the exact query that the web API is using
SELECT 
  id,
  name,
  slug,
  description,
  location,
  start_date,
  end_date,
  status,
  image_url,
  created_at,
  is_visible
FROM tournaments
WHERE status IN ('upcoming', 'live')
  AND is_visible = true
ORDER BY start_date ASC;

-- Show count
SELECT 
  COUNT(*) as tournament_count,
  STRING_AGG(name, ', ') as tournament_names
FROM tournaments
WHERE status IN ('upcoming', 'live')
  AND is_visible = true;

-- Specifically check BMW
SELECT 
  name,
  status,
  is_visible,
  CASE 
    WHEN status IN ('upcoming', 'live') AND is_visible = true THEN '✅ SHOULD BE RETURNED BY API'
    ELSE '❌ NOT RETURNED: status=' || status || ', is_visible=' || COALESCE(is_visible::text, 'NULL')
  END as api_result
FROM tournaments
WHERE name ILIKE '%BMW Australian PGA%';

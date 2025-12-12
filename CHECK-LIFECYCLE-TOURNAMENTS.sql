-- Check Tournaments for Lifecycle Manager Compatibility
-- Run this to see which tournaments might have issues displaying in the Lifecycle Manager

-- Check all tournaments with their key fields
SELECT 
  id,
  name,
  slug,
  status,
  start_date,
  end_date,
  timezone,
  registration_opens_at,
  registration_closes_at,
  created_at,
  -- Flag potential issues
  CASE 
    WHEN status IS NULL THEN 'MISSING STATUS'
    WHEN timezone IS NULL THEN 'MISSING TIMEZONE'
    WHEN start_date IS NULL THEN 'MISSING START DATE'
    WHEN end_date IS NULL THEN 'MISSING END DATE'
    ELSE 'OK'
  END as issue_check
FROM tournaments
ORDER BY created_at DESC
LIMIT 20;

-- Check for active tournaments specifically
SELECT 
  t.name,
  t.status,
  t.start_date,
  t.end_date,
  t.timezone,
  t.registration_opens_at,
  t.registration_closes_at,
  COUNT(DISTINCT tg.golfer_id) as golfer_count,
  COUNT(DISTINCT tc.id) as competition_count
FROM tournaments t
LEFT JOIN tournament_golfers tg ON tg.tournament_id = t.id
LEFT JOIN tournament_competitions tc ON tc.tournament_id = t.id
WHERE t.status IN ('upcoming', 'registration_open', 'in_progress')
  OR t.start_date >= NOW() - INTERVAL '7 days'
GROUP BY t.id, t.name, t.status, t.start_date, t.end_date, t.timezone, t.registration_opens_at, t.registration_closes_at
ORDER BY t.start_date DESC;

-- Fix tournaments missing status (set to 'upcoming' by default)
-- UNCOMMENT TO RUN:
-- UPDATE tournaments 
-- SET status = 'upcoming' 
-- WHERE status IS NULL;

-- Fix tournaments missing timezone (set to UTC)
-- UNCOMMENT TO RUN:
-- UPDATE tournaments 
-- SET timezone = 'UTC' 
-- WHERE timezone IS NULL;

-- Check specific tournaments by name
SELECT 
  t.id,
  t.name,
  t.status,
  t.start_date,
  t.end_date,
  t.timezone,
  t.registration_opens_at,
  t.registration_closes_at,
  COUNT(DISTINCT tg.golfer_id) as golfer_count,
  COUNT(DISTINCT tc.id) as competition_count
FROM tournaments t
LEFT JOIN tournament_golfers tg ON tg.tournament_id = t.id
LEFT JOIN tournament_competitions tc ON tc.tournament_id = t.id
WHERE t.name ILIKE '%Q School%' 
   OR t.name ILIKE '%Alfred Dunhill%'
   OR t.name ILIKE '%Ferry%'
GROUP BY t.id, t.name, t.status, t.start_date, t.end_date, t.timezone, t.registration_opens_at, t.registration_closes_at;

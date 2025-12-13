-- ===================================================================
-- CHECK FOR CROSS-CONTAMINATION BETWEEN TOURNAMENTS
-- ===================================================================

-- Get both tournament IDs
SELECT id, name, slug
FROM tournaments
WHERE slug IN ('alfred-dunhill-championship', 'pga-tour-q-school-presented-by-korn-ferry')
ORDER BY name;

-- Count golfers per tournament
SELECT 
  t.name,
  t.slug,
  COUNT(*) as golfer_count
FROM tournament_golfers tg
JOIN tournaments t ON t.id = tg.tournament_id
WHERE t.slug IN ('alfred-dunhill-championship', 'pga-tour-q-school-presented-by-korn-ferry')
GROUP BY t.name, t.slug;

-- Check if any golfers appear in BOTH tournaments (unlikely but possible)
SELECT 
  g.full_name,
  COUNT(DISTINCT tg.tournament_id) as tournament_count,
  STRING_AGG(DISTINCT t.name, ' + ') as tournaments
FROM tournament_golfers tg
JOIN tournaments t ON t.id = tg.tournament_id
JOIN golfers g ON g.id = tg.golfer_id
WHERE t.slug IN ('alfred-dunhill-championship', 'pga-tour-q-school-presented-by-korn-ferry')
GROUP BY g.full_name
HAVING COUNT(DISTINCT tg.tournament_id) > 1;

-- Check what the API is actually fetching
-- This simulates the API query
SELECT COUNT(*) as api_result_count
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

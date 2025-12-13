-- Check if Alfred Dunhill has golfers assigned
-- Run in Supabase SQL Editor

-- Check tournament golfers
SELECT 
  t.name as tournament_name,
  t.slug,
  COUNT(tg.golfer_id) as golfer_count
FROM tournaments t
LEFT JOIN tournament_golfers tg ON t.id = tg.tournament_id
WHERE t.slug LIKE '%alfred%' OR t.slug LIKE '%dunhill%'
GROUP BY t.id, t.name, t.slug;

-- Check ONE 2 ONE instances for this tournament
SELECT 
  ci.id as instance_id,
  ci.tournament_id,
  ci.status,
  t.name as tournament_name
FROM competition_instances ci
JOIN tournaments t ON ci.tournament_id = t.id
WHERE t.slug LIKE '%alfred%' OR t.slug LIKE '%dunhill%'
ORDER BY ci.created_at DESC
LIMIT 10;

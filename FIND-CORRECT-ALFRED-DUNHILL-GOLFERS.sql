-- Find golfers added BEFORE the incorrect sync on 2025-12-12 11:47:17
-- These should be the correct Alfred Dunhill golfers

SELECT 
  tg.created_at,
  g.full_name,
  g.world_rank
FROM tournament_golfers tg
JOIN golfers g ON g.id = tg.golfer_id
WHERE tg.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
  AND tg.created_at < '2025-12-12 11:47:17'
ORDER BY tg.created_at DESC
LIMIT 20;

-- Count golfers by sync batch
SELECT 
  tg.created_at,
  COUNT(*) as golfer_count
FROM tournament_golfers tg
JOIN golfers g ON g.id = tg.golfer_id
WHERE tg.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
GROUP BY tg.created_at
ORDER BY tg.created_at DESC;

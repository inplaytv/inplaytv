-- Find the CORRECT 156 golfers vs the 173 incorrect extras
-- The correct golfers should be the ones synced from DataGolf field

-- Check when golfers were added (timestamps)
SELECT 
  DATE_TRUNC('minute', created_at) as sync_time,
  COUNT(*) as golfers_added,
  MIN(created_at) as first_golfer,
  MAX(created_at) as last_golfer
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
GROUP BY DATE_TRUNC('minute', created_at)
ORDER BY sync_time DESC;

-- Show sample golfers from each batch
SELECT 
  tg.created_at,
  g.full_name,
  g.world_rank
FROM tournament_golfers tg
JOIN golfers g ON g.id = tg.golfer_id
WHERE tg.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
ORDER BY tg.created_at DESC
LIMIT 20;

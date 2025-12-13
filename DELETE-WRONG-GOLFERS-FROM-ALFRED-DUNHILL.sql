-- ===================================================================
-- EMERGENCY FIX: Delete PGA Q-School golfers from Alfred Dunhill
-- The sync on 2025-12-12 11:47:17 added 173 wrong golfers
-- ===================================================================

-- Step 1: Verify what we're about to delete
SELECT 
  'GOLFERS TO DELETE' as action,
  COUNT(*) as count,
  STRING_AGG(g.full_name, ', ') as sample_names
FROM tournament_golfers tg
JOIN golfers g ON g.id = tg.golfer_id
WHERE tg.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
  AND tg.created_at = '2025-12-12 11:47:17.621559+00';

-- Step 2: DELETE the incorrect golfers (added on 2025-12-12 11:47:17)
DELETE FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
  AND created_at = '2025-12-12 11:47:17.621559+00';

-- Step 3: Verify the fix
SELECT 
  '✅ REMAINING GOLFERS' as status,
  COUNT(*) as total_golfers,
  COUNT(DISTINCT golfer_id) as unique_golfers
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Step 4: Show sample of remaining golfers
SELECT 
  g.full_name,
  g.world_rank
FROM tournament_golfers tg
JOIN golfers g ON g.id = tg.golfer_id
WHERE tg.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
ORDER BY g.world_rank NULLS LAST
LIMIT 10;

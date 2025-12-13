-- ===================================================================
-- CRITICAL: CHECK FOR DUPLICATE GOLFERS IN TOURNAMENT
-- Alfred Dunhill Championship should have 156 players, not 329
-- ===================================================================

-- Check for duplicates in tournament_golfers for Alfred Dunhill
SELECT 
  golfer_id,
  COUNT(*) as occurrence_count,
  STRING_AGG(id::text, ', ') as row_ids
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
GROUP BY golfer_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Get total count
SELECT 
  COUNT(*) as total_golfers,
  COUNT(DISTINCT golfer_id) as unique_golfers
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Show recent syncs to identify when duplicates were added
SELECT 
  created_at,
  COUNT(*) as golfers_added
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
GROUP BY created_at
ORDER BY created_at DESC
LIMIT 10;

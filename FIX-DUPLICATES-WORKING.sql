-- ===================================================================
-- WORKING FIX: Remove Duplicate Golfers - Simplified Approach
-- ===================================================================

-- Step 1: Create a temporary table with only unique golfers (keeping most recent)
CREATE TEMP TABLE unique_golfers AS
SELECT DISTINCT ON (golfer_id) *
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
ORDER BY golfer_id, created_at DESC;

-- Step 2: Delete ALL golfers from this tournament
DELETE FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Step 3: Insert back only the unique ones
INSERT INTO tournament_golfers
SELECT * FROM unique_golfers;

-- Step 4: Verify
SELECT 
  COUNT(*) as total_golfers,
  COUNT(DISTINCT golfer_id) as unique_golfers,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT golfer_id) THEN '✅ SUCCESS - No duplicates!'
    ELSE '❌ FAILED - Still has duplicates'
  END as status
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Drop temp table
DROP TABLE unique_golfers;

-- ===================================================================
-- COMPLETE FIX: Remove PGA Q-School players from BOTH tables
-- No temp tables - just direct deletes
-- ===================================================================

-- Step 1: Show what we're about to delete
SELECT 
  'WRONG GOLFERS IN TOURNAMENT_GOLFERS' as table_name,
  COUNT(*) as count
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
  AND created_at = '2025-12-12 11:47:17.621559+00';

SELECT 
  'WRONG GOLFERS IN GOLFER_GROUP_MEMBERS' as table_name,
  COUNT(*) as count
FROM golfer_group_members ggm
WHERE ggm.golfer_id IN (
    SELECT DISTINCT golfer_id
    FROM tournament_golfers
    WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
      AND created_at = '2025-12-12 11:47:17.621559+00'
  )
  AND ggm.group_id IN (
    SELECT assigned_golfer_group_id 
    FROM tournament_competitions 
    WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
      AND assigned_golfer_group_id IS NOT NULL
  );

-- Step 2: DELETE from golfer_group_members first
DELETE FROM golfer_group_members
WHERE golfer_id IN (
    SELECT DISTINCT golfer_id
    FROM tournament_golfers
    WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
      AND created_at = '2025-12-12 11:47:17.621559+00'
  )
  AND group_id IN (
    SELECT assigned_golfer_group_id 
    FROM tournament_competitions 
    WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
      AND assigned_golfer_group_id IS NOT NULL
  );

-- Step 3: DELETE from tournament_golfers
DELETE FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
  AND created_at = '2025-12-12 11:47:17.621559+00';

-- Step 4: Verify the fix
SELECT 
  '✅ TOURNAMENT_GOLFERS REMAINING' as status,
  COUNT(*) as total_golfers
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

SELECT 
  gg.name as group_name,
  COUNT(ggm.golfer_id) as golfers_in_group
FROM golfer_groups gg
LEFT JOIN golfer_group_members ggm ON ggm.group_id = gg.id
WHERE gg.id IN (
    SELECT assigned_golfer_group_id 
    FROM tournament_competitions 
    WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
      AND assigned_golfer_group_id IS NOT NULL
  )
GROUP BY gg.name;

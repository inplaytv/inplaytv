-- ===================================================================
-- SIMPLE FIX: Remove golfer groups and clean up tournament_golfers
-- ===================================================================

-- Step 1: Remove golfer group assignments from all competitions
UPDATE tournament_competitions
SET assigned_golfer_group_id = NULL
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Step 2: Delete the 174 wrong golfers from tournament_golfers
DELETE FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
  AND created_at = '2025-12-12 11:47:17.621559+00';

-- Step 3: Verify
SELECT 
  '✅ COMPETITIONS (should have no assigned_golfer_group_id)' as status,
  ct.name,
  tc.assigned_golfer_group_id
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE tc.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

SELECT 
  '✅ TOURNAMENT_GOLFERS (should be 155)' as status,
  COUNT(*) as total_golfers
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

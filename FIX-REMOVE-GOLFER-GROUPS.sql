-- ===================================================================
-- EMERGENCY FIX: Remove Golfer Groups from Alfred Dunhill Competitions
-- This will make all competitions use the full tournament field (329 golfers)
-- ===================================================================

-- Option 1: Remove assigned golfer groups from all competitions
-- This makes each competition use ALL tournament golfers
UPDATE tournament_competitions
SET assigned_golfer_group_id = NULL
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Option 2: Delete all golfer group memberships for this tournament
-- DELETE FROM golfer_group_members
-- WHERE group_id IN (
--   SELECT id FROM golfer_groups 
--   WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
-- );

-- Option 3: Delete the golfer groups themselves
-- DELETE FROM golfer_groups
-- WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Verify the fix
SELECT 
  ct.name as competition_name,
  tc.assigned_golfer_group_id,
  CASE 
    WHEN tc.assigned_golfer_group_id IS NULL THEN '✅ No group - will use all tournament golfers'
    ELSE '⚠️ Still has group assigned'
  END as status
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE tc.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

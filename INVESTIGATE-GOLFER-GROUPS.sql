-- ===================================================================
-- INVESTIGATE GOLFER GROUPS FOR ALFRED DUNHILL CHAMPIONSHIP
-- ===================================================================

-- Get all competitions and their assigned golfer groups
SELECT 
  tc.id,
  ct.name as competition_name,
  tc.competition_type_id,
  tc.assigned_golfer_group_id,
  gg.name as group_name,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = tc.assigned_golfer_group_id) as golfers_in_group
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON ct.id = tc.competition_type_id
LEFT JOIN golfer_groups gg ON gg.id = tc.assigned_golfer_group_id
WHERE tc.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
ORDER BY ct.name;

-- Check how many golfers are in each group
SELECT 
  gg.id,
  gg.name as group_name,
  COUNT(DISTINCT ggm.golfer_id) as unique_golfers,
  COUNT(*) as total_entries
FROM golfer_groups gg
LEFT JOIN golfer_group_members ggm ON ggm.group_id = gg.id
WHERE gg.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
GROUP BY gg.id, gg.name;

-- Total golfers in tournament
SELECT COUNT(*) as total_tournament_golfers
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

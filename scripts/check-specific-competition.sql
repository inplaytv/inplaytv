-- Check ALL ONE 2 ONE competitions to see if there are multiple
SELECT 
  tc.id as competition_id,
  ct.name as competition_type,
  tc.assigned_golfer_group_id,
  gg.name as assigned_group_name,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = tc.assigned_golfer_group_id) as golfers_in_assigned_group,
  (SELECT COUNT(*) FROM competition_golfers WHERE competition_id = tc.id) as golfers_actually_in_competition,
  tc.created_at
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
WHERE ct.name LIKE '%ONE%ONE%'
ORDER BY tc.created_at DESC;

-- Check the specific competition from the terminal log
-- The terminal showed: 48d02519-7cba-4d3d-9dc7-0908e6ed626d
SELECT 
  tc.id,
  ct.name as competition_type,
  gg.name as assigned_group,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = tc.assigned_golfer_group_id) as group_count,
  (SELECT COUNT(*) FROM competition_golfers WHERE competition_id = tc.id) as competition_count
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
WHERE tc.id = '48d02519-7cba-4d3d-9dc7-0908e6ed626d';

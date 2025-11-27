-- Check both competition IDs
SELECT 
  tc.id as competition_id,
  ct.name as competition_type,
  tc.assigned_golfer_group_id,
  gg.name as assigned_group_name,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = tc.assigned_golfer_group_id) as golfers_in_group,
  (SELECT COUNT(*) FROM competition_golfers WHERE competition_id = tc.id) as golfers_in_competition,
  tc.created_at
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
WHERE tc.id IN ('48d02519-7cba-4d3d-9dc7-0908e6ed626d', '431c4b20-8656-4e35-92fd-10643b9aba3d')
ORDER BY tc.created_at DESC;

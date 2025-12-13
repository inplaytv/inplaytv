-- Check the relationship between competitions and golfer groups
SELECT 
  tc.id as competition_id,
  tc.name as competition_name,
  tc.golfer_group_id,
  gg.name as golfer_group_name,
  COUNT(DISTINCT tg.golfer_id) as golfer_count
FROM tournament_competitions tc
LEFT JOIN golfer_groups gg ON gg.id = tc.golfer_group_id
LEFT JOIN tournament_golfers tg ON tg.golfer_group_id = tc.golfer_group_id
WHERE tc.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
GROUP BY tc.id, tc.name, tc.golfer_group_id, gg.name;

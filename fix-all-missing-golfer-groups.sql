-- Find all competitions without golfer groups
SELECT 
  tc.id,
  t.name as tournament_name,
  ct.name as competition_name,
  tc.assigned_golfer_group_id,
  t.id as tournament_id
FROM tournament_competitions tc
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.assigned_golfer_group_id IS NULL
ORDER BY t.name, ct.name;

-- Find golfer groups for each tournament
SELECT 
  t.id as tournament_id,
  t.name as tournament_name,
  gg.id as golfer_group_id,
  gg.name as group_name,
  COUNT(ggm.golfer_id) as golfer_count
FROM tournaments t
LEFT JOIN golfer_groups gg ON gg.name LIKE '%' || t.name || '%'
LEFT JOIN golfer_group_members ggm ON gg.id = ggm.group_id
GROUP BY t.id, t.name, gg.id, gg.name
ORDER BY t.name;

-- Quick fix: Assign golfer groups based on tournament name matching
-- RUN THIS AFTER REVIEWING THE ABOVE RESULTS:
/*
UPDATE tournament_competitions tc
SET assigned_golfer_group_id = gg.id
FROM tournaments t, golfer_groups gg
WHERE tc.tournament_id = t.id
  AND gg.name LIKE '%' || t.name || '%'
  AND tc.assigned_golfer_group_id IS NULL;
*/

-- Verify after update
/*
SELECT 
  tc.id,
  t.name as tournament_name,
  ct.name as competition_name,
  tc.assigned_golfer_group_id,
  gg.name as golfer_group_name
FROM tournament_competitions tc
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
ORDER BY t.name, ct.name;
*/

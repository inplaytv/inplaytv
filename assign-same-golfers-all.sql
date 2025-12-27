-- Assign "Mister G's Open Field" group to ALL competitions for testing
UPDATE tournament_competitions tc
SET assigned_golfer_group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
WHERE tc.assigned_golfer_group_id IS NULL
  AND tc.tournament_id IN (
    'bc7a3ef0-1a8d-42e7-bf60-5ad74e9ac084',  -- THE GREENIDGE OPEN
    '66d0e61a-2d12-47bf-a93f-509e2b2a33f9'   -- THE THANET OPEN
  );

-- Verify all competitions now have golfer groups
SELECT 
  t.name as tournament_name,
  ct.name as competition_name,
  tc.assigned_golfer_group_id IS NOT NULL as has_group,
  gg.name as golfer_group_name,
  COUNT(ggm.golfer_id) as golfer_count
FROM tournament_competitions tc
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
LEFT JOIN golfer_group_members ggm ON gg.id = ggm.group_id
GROUP BY t.name, ct.name, tc.assigned_golfer_group_id, gg.name
ORDER BY t.name, ct.name;

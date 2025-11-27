-- Find the specific ONE 2 ONE competition and check its golfer assignment
SELECT 
  tc.id as competition_id,
  ct.name as competition_type,
  tc.assigned_golfer_group_id,
  gg.name as assigned_group_name,
  gg.slug as group_slug,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = tc.assigned_golfer_group_id) as golfers_in_assigned_group,
  (SELECT COUNT(*) FROM competition_golfers WHERE competition_id = tc.id) as golfers_actually_in_competition,
  tc.created_at,
  tc.updated_at
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
WHERE ct.name LIKE '%ONE%ONE%'
ORDER BY tc.created_at DESC
LIMIT 1;

-- Now check which golfers are actually in competition_golfers for this competition
-- Replace the ID below with the competition_id from the query above
-- SELECT g.first_name, g.last_name, g.world_rank
-- FROM competition_golfers cg
-- LEFT JOIN golfers g ON g.id = cg.golfer_id
-- WHERE cg.competition_id = 'PASTE_COMPETITION_ID_HERE'
-- ORDER BY g.world_rank NULLS LAST
-- LIMIT 10;

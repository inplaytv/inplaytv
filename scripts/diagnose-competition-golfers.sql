-- Diagnostic: Check golfer group assignments and competition_golfers
-- Run this to see what's in your ONE 2 ONE competition

-- Find the ONE 2 ONE competition
SELECT 
  tc.id,
  tc.tournament_id,
  ct.name as competition_type_name,
  tc.assigned_golfer_group_id,
  (SELECT name FROM golfer_groups WHERE id = tc.assigned_golfer_group_id) as group_name,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = tc.assigned_golfer_group_id) as golfers_in_group,
  (SELECT COUNT(*) FROM competition_golfers WHERE competition_id = tc.id) as golfers_in_competition
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE ct.name LIKE '%ONE%'
ORDER BY tc.created_at DESC
LIMIT 5;

-- Get the competition ID from above, then check the golfers:
-- Replace 'YOUR_COMPETITION_ID' with the actual ID

-- SELECT COUNT(*) as total_golfers
-- FROM competition_golfers
-- WHERE competition_id = 'YOUR_COMPETITION_ID';

-- SELECT 
--   cg.golfer_id,
--   g.first_name,
--   g.last_name,
--   g.world_rank,
--   cg.salary
-- FROM competition_golfers cg
-- LEFT JOIN golfers g ON g.id = cg.golfer_id
-- WHERE cg.competition_id = 'YOUR_COMPETITION_ID'
-- ORDER BY g.world_rank NULLS LAST
-- LIMIT 10;

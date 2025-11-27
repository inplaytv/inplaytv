-- Find all ONE 2 ONE competitions for PGA Championship 2026
SELECT 
  tc.id as competition_id,
  t.name as tournament_name,
  ct.name as competition_type,
  tc.assigned_golfer_group_id,
  gg.name as assigned_group_name,
  (SELECT COUNT(*) FROM competition_golfers WHERE competition_id = tc.id) as golfers_count,
  tc.status,
  tc.created_at,
  tc.updated_at
FROM tournament_competitions tc
JOIN tournaments t ON t.id = tc.tournament_id
JOIN competition_types ct ON ct.id = tc.competition_type_id
LEFT JOIN golfer_groups gg ON gg.id = tc.assigned_golfer_group_id
WHERE t.name LIKE '%PGA Championship 2026%'
  AND ct.name LIKE '%ONE%ONE%'
ORDER BY tc.created_at DESC;

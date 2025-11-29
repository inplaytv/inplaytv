-- Check BMW Australian PGA Championship golfer status

-- Get tournament ID
SELECT 
  id,
  name,
  status,
  tour
FROM tournaments 
WHERE name ILIKE '%BMW Australian PGA%';

-- Count golfers linked to tournament
SELECT 
  t.name,
  COUNT(tg.id) as golfer_count,
  COUNT(DISTINCT g.id) as unique_golfers
FROM tournaments t
LEFT JOIN tournament_golfers tg ON t.id = tg.tournament_id
LEFT JOIN golfers g ON tg.golfer_id = g.id
WHERE t.name ILIKE '%BMW Australian PGA%'
GROUP BY t.id, t.name;

-- Show first 10 golfers if any
SELECT 
  g.first_name,
  g.last_name,
  g.dg_id,
  tg.status
FROM tournaments t
JOIN tournament_golfers tg ON t.id = tg.tournament_id
JOIN golfers g ON tg.golfer_id = g.id
WHERE t.name ILIKE '%BMW Australian PGA%'
ORDER BY g.last_name
LIMIT 10;

-- Check golfer group status
SELECT 
  gg.name,
  gg.description,
  COUNT(ggm.golfer_id) as member_count
FROM golfer_groups gg
LEFT JOIN golfer_group_members ggm ON gg.id = ggm.group_id
WHERE gg.name ILIKE '%BMW Australian PGA%'
GROUP BY gg.id, gg.name, gg.description;

-- Check competition assignments
SELECT 
  ct.name as competition_name,
  tc.status,
  tc.assigned_golfer_group_id,
  gg.name as assigned_group_name,
  COUNT(ggm.golfer_id) as golfers_in_group
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
LEFT JOIN golfer_group_members ggm ON gg.id = ggm.group_id
WHERE t.name ILIKE '%BMW Australian PGA%'
GROUP BY tc.id, ct.name, tc.status, tc.assigned_golfer_group_id, gg.name
ORDER BY tc.created_at;

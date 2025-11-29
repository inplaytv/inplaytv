-- Check BMW Australian PGA Championship tournament and competitions status

-- 1. Check tournament basic info
SELECT 
  id,
  name,
  status,
  tour,
  start_date,
  end_date,
  created_at
FROM tournaments 
WHERE name ILIKE '%BMW Australian PGA%';

-- 2. Check ALL competitions for this tournament
SELECT 
  ct.name as competition_name,
  tc.status,
  tc.reg_open_at,
  tc.reg_close_at,
  tc.start_at,
  tc.end_at,
  tc.assigned_golfer_group_id,
  tc.created_at
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.name ILIKE '%BMW Australian PGA%'
ORDER BY tc.created_at;

-- 3. Count golfers in the assigned group
SELECT 
  t.name as tournament_name,
  ct.name as competition_name,
  tc.status,
  gg.name as golfer_group_name,
  COUNT(ggm.golfer_id) as golfers_in_group
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
LEFT JOIN golfer_group_members ggm ON gg.id = ggm.group_id
WHERE t.name ILIKE '%BMW Australian PGA%'
GROUP BY t.name, ct.name, tc.status, gg.name, tc.created_at
ORDER BY tc.created_at;

-- 4. Check if tournament should be visible on frontend
-- (typically need: status = 'upcoming' or 'live', and at least one competition with reg_open status)
SELECT 
  t.name,
  t.status as tournament_status,
  COUNT(CASE WHEN tc.status = 'reg_open' THEN 1 END) as reg_open_comps,
  COUNT(CASE WHEN tc.status = 'live' THEN 1 END) as live_comps,
  COUNT(CASE WHEN tc.status = 'upcoming' THEN 1 END) as upcoming_comps,
  COUNT(CASE WHEN tc.status = 'completed' THEN 1 END) as completed_comps
FROM tournaments t
LEFT JOIN tournament_competitions tc ON t.id = tc.tournament_id
WHERE t.name ILIKE '%BMW Australian PGA%'
GROUP BY t.id, t.name, t.status;

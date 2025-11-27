-- Check The Masters tournament and its golfers

-- 1. Find The Masters tournament
SELECT id, name, status, assigned_golfer_group_id
FROM public.tournaments
WHERE name ILIKE '%masters%'
ORDER BY created_at DESC;

-- 2. Find competitions for The Masters
SELECT 
  tc.id,
  tc.tournament_id,
  t.name as tournament_name,
  tc.status,
  tc.assigned_golfer_group_id,
  ct.name as competition_type
FROM public.tournament_competitions tc
JOIN public.tournaments t ON t.id = tc.tournament_id
JOIN public.competition_types ct ON ct.id = tc.competition_type_id
WHERE t.name ILIKE '%masters%'
ORDER BY tc.created_at DESC;

-- 3. Check if there are golfers assigned to The Masters competitions
SELECT 
  tc.id as competition_id,
  t.name as tournament_name,
  COUNT(cg.golfer_id) as golfer_count
FROM public.tournament_competitions tc
JOIN public.tournaments t ON t.id = tc.tournament_id
LEFT JOIN public.competition_golfers cg ON cg.competition_id = tc.id
WHERE t.name ILIKE '%masters%'
GROUP BY tc.id, t.name
ORDER BY tc.created_at DESC;

-- 4. Check if the assigned_golfer_group_id has golfers
SELECT 
  t.name as tournament_name,
  t.assigned_golfer_group_id,
  gg.name as group_name,
  COUNT(ggg.golfer_id) as golfers_in_group
FROM public.tournaments t
LEFT JOIN public.golfer_groups gg ON gg.id = t.assigned_golfer_group_id
LEFT JOIN public.golfer_group_golfers ggg ON ggg.group_id = gg.id
WHERE t.name ILIKE '%masters%'
GROUP BY t.id, t.name, t.assigned_golfer_group_id, gg.name
ORDER BY t.created_at DESC;

-- 5. Sample golfers from the group (if any)
SELECT 
  g.id,
  g.full_name,
  g.world_ranking
FROM public.golfers g
WHERE g.id IN (
  SELECT ggg.golfer_id
  FROM public.golfer_group_golfers ggg
  JOIN public.golfer_groups gg ON gg.id = ggg.group_id
  JOIN public.tournaments t ON t.assigned_golfer_group_id = gg.id
  WHERE t.name ILIKE '%masters%'
  LIMIT 1
)
ORDER BY g.world_ranking ASC NULLS LAST
LIMIT 10;

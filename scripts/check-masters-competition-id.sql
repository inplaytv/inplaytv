-- Check The Masters competition specifically
SELECT 
  tc.id,
  tc.assigned_golfer_group_id,
  t.name as tournament_name,
  ct.name as competition_type,
  gg.name as golfer_group_name,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = tc.assigned_golfer_group_id) as golfers_in_group
FROM public.tournament_competitions tc
JOIN public.tournaments t ON t.id = tc.tournament_id
JOIN public.competition_types ct ON ct.id = tc.competition_type_id
LEFT JOIN public.golfer_groups gg ON gg.id = tc.assigned_golfer_group_id
WHERE tc.id = '10f2b159-32e1-4e3e-8ccb-96e6d6a8f8b3';

-- If assigned_golfer_group_id is NULL, we need to set it
-- Check what golfer groups are available
SELECT id, name, created_at 
FROM public.golfer_groups 
ORDER BY created_at DESC;

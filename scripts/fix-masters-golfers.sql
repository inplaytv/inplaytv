-- Step 1: Find available golfer groups with their golfer counts
SELECT 
  gg.id,
  gg.name,
  gg.created_at,
  COUNT(ggm.golfer_id) as golfer_count
FROM public.golfer_groups gg
LEFT JOIN public.golfer_group_members ggm ON ggm.group_id = gg.id
GROUP BY gg.id, gg.name, gg.created_at
ORDER BY golfer_count DESC, gg.created_at DESC;

-- Step 2: Assuming the first group with golfers is the one to use
-- Update The Masters competition with the golfer group ID
-- (Replace 'YOUR_GROUP_ID_HERE' with the actual ID from Step 1)

-- UPDATE public.tournament_competitions
-- SET assigned_golfer_group_id = 'YOUR_GROUP_ID_HERE'
-- WHERE id = '10f2b159-32e1-4e3e-8ccb-96e6d6a8f8b3';

-- Step 3: After updating, populate the competition_golfers
-- INSERT INTO public.competition_golfers (competition_id, golfer_id)
-- SELECT DISTINCT
--   '10f2b159-32e1-4e3e-8ccb-96e6d6a8f8b3' as competition_id,
--   ggm.golfer_id
-- FROM public.golfer_group_members ggm
-- WHERE ggm.group_id = 'YOUR_GROUP_ID_HERE'
-- ON CONFLICT (competition_id, golfer_id) DO NOTHING;

-- Populate competition_golfers from assigned golfer groups
-- This ensures competitions have golfers from their tournament's assigned group

-- Populate competition_golfers for all competitions based on their assigned_golfer_group_id
INSERT INTO public.competition_golfers (competition_id, golfer_id)
SELECT DISTINCT
  tc.id as competition_id,
  ggm.golfer_id
FROM public.tournament_competitions tc
JOIN public.golfer_group_members ggm ON ggm.group_id = tc.assigned_golfer_group_id
WHERE tc.assigned_golfer_group_id IS NOT NULL
  AND NOT EXISTS (
    -- Don't insert if already exists
    SELECT 1 
    FROM public.competition_golfers cg 
    WHERE cg.competition_id = tc.id 
    AND cg.golfer_id = ggm.golfer_id
  )
ON CONFLICT (competition_id, golfer_id) DO NOTHING;

-- Check results
SELECT 
  t.name as tournament_name,
  tc.id as competition_id,
  ct.name as competition_type,
  COUNT(cg.golfer_id) as golfer_count
FROM public.tournament_competitions tc
JOIN public.tournaments t ON t.id = tc.tournament_id
JOIN public.competition_types ct ON ct.id = tc.competition_type_id
LEFT JOIN public.competition_golfers cg ON cg.competition_id = tc.id
GROUP BY t.name, tc.id, ct.name
ORDER BY t.name, ct.name;

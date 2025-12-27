-- Assign golfer groups to the 5 competitions that are missing them
-- For testing, we'll use the same group for all tournaments

-- Update all missing competitions with Mister G's Open Field group
UPDATE tournament_competitions
SET assigned_golfer_group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
WHERE id IN (
  '6f414602-289b-43e1-af0e-0976f09724f8',  -- THE THANET OPEN - Beat The Cut
  '99be3799-7fa6-4e96-be6c-144e62acefc5',  -- THE GREENIDGE OPEN - Third Round
  'd6024949-3fcb-4f31-8b48-8032ca730910',  -- Mister G's Open - Final Strike
  '50c43826-abee-4707-8659-4ae68672e39e',  -- THE GREENIDGE OPEN - Full Course
  '76756a8a-018f-40da-a178-ec058535af58'   -- THE THANET OPEN - Final Strike
);

-- Verify all competitions now have golfer groups
SELECT 
  t.name as tournament_name,
  ct.name as competition_name,
  CASE WHEN tc.assigned_golfer_group_id IS NOT NULL THEN '✅ HAS GROUP' ELSE '❌ MISSING' END as status,
  gg.name as golfer_group_name
FROM tournament_competitions tc
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
ORDER BY t.name, ct.name;

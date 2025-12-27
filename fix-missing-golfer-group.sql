-- Check ALL competitions for Mister G's Open tournament
SELECT 
  tc.id,
  ct.name as competition_type,
  t.name as tournament,
  tc.assigned_golfer_group_id,
  gg.name as golfer_group_name,
  tc.status
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
WHERE t.name = 'Mister G''s Open'
ORDER BY ct.name;

-- Check available golfer groups
SELECT id, name FROM golfer_groups;

-- Assign the Mister G's Open Field golfer group
UPDATE tournament_competitions 
SET assigned_golfer_group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
WHERE id = '686e42b9-e2b5-42c3-90d6-fabae22b2e37';

-- Verify the update
SELECT 
  tc.id,
  ct.name as competition_type,
  t.name as tournament,
  tc.assigned_golfer_group_id,
  gg.name as golfer_group_name,
  tc.status
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
LEFT JOIN tournaments t ON tc.tournament_id = t.id
LEFT JOIN golfer_groups gg ON tc.assigned_golfer_group_id = gg.id
WHERE tc.id = '686e42b9-e2b5-42c3-90d6-fabae22b2e37';

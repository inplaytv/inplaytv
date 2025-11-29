-- Fix FINAL STRIKE competition status to reg_open

-- First, check current status
SELECT 
  ct.name as competition_name,
  tc.status,
  tc.reg_open_at,
  tc.reg_close_at,
  tc.start_at
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.name ILIKE '%BMW Australian PGA%'
  AND ct.name ILIKE '%FINAL STRIKE%';

-- Update FINAL STRIKE to reg_open
UPDATE tournament_competitions tc
SET 
  status = 'reg_open',
  updated_at = NOW()
FROM tournaments t, competition_types ct
WHERE tc.tournament_id = t.id
  AND tc.competition_type_id = ct.id
  AND t.name ILIKE '%BMW Australian PGA%'
  AND ct.name ILIKE '%FINAL STRIKE%';

-- Verify the change
SELECT 
  ct.name as competition_name,
  tc.status,
  tc.assigned_golfer_group_id
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.name ILIKE '%BMW Australian PGA%'
  AND ct.name ILIKE '%FINAL STRIKE%';

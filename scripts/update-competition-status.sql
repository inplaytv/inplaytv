-- Update existing Hero World Challenge competitions to reg_open status
UPDATE tournament_competitions 
SET status = 'reg_open'
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'hero-world-challenge')
  AND status = 'upcoming';

-- Display updated competitions
SELECT 
  tc.id,
  ct.name as competition_type,
  tc.status,
  tc.entry_fee_pennies / 100 as entry_fee_pounds
FROM tournament_competitions tc
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = (SELECT id FROM tournaments WHERE slug = 'hero-world-challenge');

-- Now check tournament_competitions (InPlay competitions) table

-- Get structure of tournament_competitions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournament_competitions' 
ORDER BY ordinal_position;

-- Check which tournament these 6 competition_ids belong to
SELECT tc.id, tc.tournament_id, t.name as tournament_name, tc.competition_type_id, tc.entry_fee_pennies
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
WHERE tc.id IN (
  'ccd8d96d-9150-468c-ac97-50f0c87e4589',
  'b8fbecb6-61a7-4c95-b68b-3330bafa549d',
  '17f1e267-85aa-4424-a2d2-73154aff424f',
  '8c5e3477-9d6f-4d89-92de-73e47ca6d829',
  '8899cccf-11f1-4d06-b837-84079ca34bfb',
  'e2188af2-0925-4a4d-8435-d69de11559d1'
);

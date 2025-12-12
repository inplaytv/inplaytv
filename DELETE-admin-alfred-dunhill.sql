-- DELETE Admin's 6 InPlay Competition Entries for Alfred Dunhill Championship
-- All 6 entries confirmed to belong to tournament: f091f409-8e88-437a-a97a-342b8f3c0ba0

-- STEP 1: Preview what will be deleted
SELECT 
  ce.id,
  ce.competition_id,
  ce.entry_fee_paid,
  ce.total_salary,
  ce.status,
  ce.created_at
FROM competition_entries ce
WHERE ce.user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
  AND ce.competition_id IN (
    'ccd8d96d-9150-468c-ac97-50f0c87e4589',
    'b8fbecb6-61a7-4c95-b68b-3330bafa549d',
    '17f1e267-85aa-4424-a2d2-73154aff424f',
    '8c5e3477-9d6f-4d89-92de-73e47ca6d829',
    '8899cccf-11f1-4d06-b837-84079ca34bfb',
    'e2188af2-0925-4a4d-8435-d69de11559d1'
  );

-- STEP 2: Run this to DELETE (only after confirming STEP 1 results)
/*
DELETE FROM competition_entries
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
  AND competition_id IN (
    'ccd8d96d-9150-468c-ac97-50f0c87e4589',
    'b8fbecb6-61a7-4c95-b68b-3330bafa549d',
    '17f1e267-85aa-4424-a2d2-73154aff424f',
    '8c5e3477-9d6f-4d89-92de-73e47ca6d829',
    '8899cccf-11f1-4d06-b837-84079ca34bfb',
    'e2188af2-0925-4a4d-8435-d69de11559d1'
  )
RETURNING id, competition_id;
*/

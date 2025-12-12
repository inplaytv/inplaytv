-- Check what the leaderboard API is actually returning

-- Get the competition_id from one of the Alfred Dunhill competitions
SELECT id, tournament_id, entry_fee_pennies, status
FROM tournament_competitions
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
ORDER BY entry_fee_pennies;

-- For each competition, check how many entries exist
SELECT 
  tc.id as competition_id,
  tc.entry_fee_pennies / 100 as entry_fee_pounds,
  COUNT(ce.id) as entry_count
FROM tournament_competitions tc
LEFT JOIN competition_entries ce ON ce.competition_id = tc.id
WHERE tc.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
GROUP BY tc.id, tc.entry_fee_pennies
ORDER BY tc.entry_fee_pennies;

-- Check if there are any entries without competition_id but with instance_id for this tournament
SELECT 
  ce.id,
  ce.instance_id,
  ti.tournament_id,
  t.name
FROM competition_entries ce
JOIN tournament_instances ti ON ti.id = ce.instance_id
JOIN tournaments t ON t.id = ti.tournament_id
WHERE ce.user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
  AND t.name ILIKE '%Alfred Dunhill%';

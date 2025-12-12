-- Find and delete user_6bf33856's entry for Alfred Dunhill - Full Course

-- Step 1: Find the user from profiles (check column structure first)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 1b: Find the user by username
SELECT *
FROM profiles
WHERE username = 'user_6bf33856';

-- Step 2: Once we have user_id, find their Full Course entry
-- Full Course is typically the highest entry fee (£10-£20)
-- Replace 'USER_ID_HERE' with actual user_id from Step 1
/*
SELECT 
  ce.id as entry_id,
  ce.competition_id,
  tc.entry_fee_pennies / 100 as entry_fee,
  ct.name as competition_type,
  ce.created_at,
  ce.status
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
LEFT JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE ce.user_id = 'USER_ID_HERE'
  AND tc.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
ORDER BY tc.entry_fee_pennies DESC;
*/

-- Step 3: Delete the Full Course entry
-- Replace 'ENTRY_ID_HERE' with the entry_id from Step 2
/*
DELETE FROM competition_entries
WHERE id = 'ENTRY_ID_HERE'
RETURNING id, competition_id, user_id;
*/

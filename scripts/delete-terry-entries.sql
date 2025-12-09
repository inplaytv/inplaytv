-- STEP 1: Just delete Terry's entries
-- Copy and paste THIS QUERY ONLY and click Run

DELETE FROM competition_entries
WHERE user_id = (SELECT id FROM profiles WHERE username ILIKE '%terry%' LIMIT 1);

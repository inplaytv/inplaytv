-- Clear Admin Entries for Alfred Dunhill Championship
-- STEP 1: Run this first to see what will be deleted

SELECT ce.id, ce.user_id, ce.competition_id, ce.created_at
FROM competition_entries ce
WHERE ce.user_id IN (SELECT user_id FROM admins LIMIT 1)
  AND ce.competition_id IN (
    SELECT id FROM tournaments 
    WHERE name ILIKE '%Alfred Dunhill%'
  );

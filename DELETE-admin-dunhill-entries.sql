-- STEP 2: Run this to DELETE the entries
-- Only run this AFTER checking the SELECT query results!

DELETE FROM competition_entries
WHERE id IN (
  SELECT ce.id
  FROM competition_entries ce
  WHERE ce.user_id IN (SELECT user_id FROM admins LIMIT 1)
    AND ce.competition_id IN (
      SELECT id FROM tournaments 
      WHERE name ILIKE '%Alfred Dunhill%'
    )
)
RETURNING id;

/* ===================================================================
   DELETE Challenge #A55CA50A (with 1611 pennies)
   WARNING: This will permanently delete the challenge
   =================================================================== */

-- First, check if there are any entries (players who joined)
SELECT 
  ce.id as entry_id,
  ce.entry_name,
  p.username,
  ce.created_at
FROM competition_entries ce
LEFT JOIN profiles p ON ce.user_id = p.id
WHERE ce.instance_id IN (
  SELECT id FROM competition_instances WHERE id::text LIKE 'a55ca50a%'
);

-- If the above shows entries, DON'T RUN THE DELETE!
-- If no entries exist, you can safely delete:

-- Delete the challenge instance
-- DELETE FROM competition_instances 
-- WHERE id::text LIKE 'a55ca50a%';

-- UNCOMMENT THE DELETE LINE ABOVE TO ACTUALLY DELETE
-- (Safety measure - you need to manually uncomment it)

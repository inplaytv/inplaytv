-- Complete wipe of Terry's entries to let him start fresh

-- Delete ALL of Terry's ONE 2 ONE entries
DELETE FROM competition_entries
WHERE user_id = (SELECT id FROM profiles WHERE username ILIKE '%terry%' LIMIT 1)
  AND instance_id IS NOT NULL;

-- Verify Terry has no entries left
SELECT COUNT(*) as terry_entries_remaining
FROM competition_entries
WHERE user_id = (SELECT id FROM profiles WHERE username ILIKE '%terry%' LIMIT 1)
  AND instance_id IS NOT NULL;

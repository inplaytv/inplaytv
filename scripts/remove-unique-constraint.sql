-- ===================================================================
-- REMOVE UNIQUE CONSTRAINT ON COMPETITION ENTRIES
-- Allow users to buy multiple scorecards for the same competition
-- ===================================================================

-- Drop the unique constraint that prevents multiple entries
ALTER TABLE competition_entries 
DROP CONSTRAINT IF EXISTS competition_entries_user_id_competition_id_key;

-- Verify constraint is removed
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'competition_entries'::regclass
  AND conname LIKE '%user_id%competition_id%';

SELECT 'Constraint removed - users can now purchase multiple scorecards' AS status;

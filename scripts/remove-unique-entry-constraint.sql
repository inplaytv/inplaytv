-- Remove unique constraint that prevents multiple entries per user per competition
-- This allows users to submit unlimited entries for the same competition

ALTER TABLE clubhouse_entries 
DROP CONSTRAINT IF EXISTS unique_entry_per_user;

-- Verify constraint is removed
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'clubhouse_entries'::regclass
  AND conname = 'unique_entry_per_user';

-- If above query returns no rows, constraint was successfully removed

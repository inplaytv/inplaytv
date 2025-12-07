/* ===================================================================
   DELETE Orphaned Entries with #A55CA50A
   These entries have NULL instance_id because the instance was deleted
   =================================================================== */

-- First, verify what will be deleted
SELECT 
  ce.id,
  SUBSTRING(ce.id::text, 1, 8) as short_id,
  ce.entry_name,
  ce.competition_id,
  ce.instance_id,
  ce.user_id,
  ce.created_at
FROM competition_entries ce
WHERE ce.id::text LIKE 'a55ca50a%';

-- Delete the orphaned entries
DELETE FROM competition_entries 
WHERE id::text LIKE 'a55ca50a%';

-- Verify deletion
SELECT COUNT(*) as remaining_entries
FROM competition_entries 
WHERE id::text LIKE 'a55ca50a%';

-- Also clean up ANY orphaned entries (entries with deleted instances)
SELECT 
  'Orphaned entries to clean' as info,
  COUNT(*) as count
FROM competition_entries ce
WHERE ce.instance_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM competition_instances ci 
    WHERE ci.id = ce.instance_id
  );

-- OPTIONAL: Delete ALL orphaned ONE 2 ONE entries (uncomment if needed)
-- DELETE FROM competition_entries 
-- WHERE instance_id IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM competition_instances ci 
--     WHERE ci.id = instance_id
--   );

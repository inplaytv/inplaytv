-- COMPLETE CLEANUP SCRIPT FOR FRESH START
-- Run this to delete all ONE 2 ONE data and start testing fresh

-- Step 1: Delete all entry picks for ONE 2 ONE entries
DELETE FROM entry_picks
WHERE entry_id IN (
  SELECT id FROM competition_entries WHERE instance_id IS NOT NULL
);

-- Step 2: Delete all competition entries for ONE 2 ONE
DELETE FROM competition_entries
WHERE instance_id IS NOT NULL;

-- Step 3: Delete all competition instances
DELETE FROM competition_instances;

-- Step 4: Verify cleanup
SELECT 'Instances remaining:' as cleanup_status, COUNT(*) as count FROM competition_instances
UNION ALL
SELECT 'Entries remaining (ONE 2 ONE):', COUNT(*) FROM competition_entries WHERE instance_id IS NOT NULL
UNION ALL
SELECT 'Entry picks remaining (ONE 2 ONE):', COUNT(*) FROM entry_picks WHERE entry_id IN (SELECT id FROM competition_entries WHERE instance_id IS NOT NULL);

-- Show confirmation
SELECT '✅ Cleanup complete! Ready for fresh testing.' as message;

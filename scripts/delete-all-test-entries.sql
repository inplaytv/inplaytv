-- Delete ALL test competition entries and related data
-- Step 1: Delete all entry picks
DELETE FROM entry_picks WHERE entry_id IN (SELECT id FROM competition_entries);

-- Step 2: Delete all competition results
DELETE FROM competition_results WHERE winner_entry_id IN (SELECT id FROM competition_entries);

-- Step 3: Delete all competition entries
DELETE FROM competition_entries;

-- Step 4: Delete all competition instances (ONE 2 ONE challenges)
DELETE FROM competition_instances;

-- Verify deletion
SELECT COUNT(*) as remaining_entries FROM competition_entries;
SELECT COUNT(*) as remaining_instances FROM competition_instances;

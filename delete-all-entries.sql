-- Drop the old trigger and function that reference competition_instances (CASCADE removes trigger automatically)
DROP FUNCTION IF EXISTS update_instance_player_count() CASCADE;

-- Delete all entries (now safe without the broken trigger)
DELETE FROM competition_entries WHERE TRUE;

-- Verify deletion
SELECT COUNT(*) as entries_remaining FROM competition_entries;

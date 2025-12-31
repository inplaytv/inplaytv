-- STEP 3: Nuclear clean slate - delete EVERYTHING
-- Run this AFTER refunds are issued

BEGIN;

-- Disable triggers to prevent cascade errors
SET session_replication_role = replica;

-- Delete all entry picks
DELETE FROM entry_picks;

-- Delete all competition entries
DELETE FROM competition_entries;

-- Delete all competition golfers (junction table)
DELETE FROM competition_golfers;

-- Delete all tournament competitions (InPlay + ONE 2 ONE)
DELETE FROM tournament_competitions;

-- Delete all tournament golfers (scores)
DELETE FROM tournament_golfers;

-- Delete all tournaments
DELETE FROM tournaments;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Show what's left (should all be 0)
SELECT 'entry_picks' as table_name, COUNT(*) as remaining FROM entry_picks
UNION ALL
SELECT 'competition_entries', COUNT(*) FROM competition_entries
UNION ALL
SELECT 'competition_golfers', COUNT(*) FROM competition_golfers
UNION ALL
SELECT 'tournament_competitions', COUNT(*) FROM tournament_competitions
UNION ALL
SELECT 'tournament_golfers', COUNT(*) FROM tournament_golfers
UNION ALL
SELECT 'tournaments', COUNT(*) FROM tournaments;

COMMIT;

-- Final verification
SELECT '=== DATABASE CLEAN SLATE COMPLETE ===' as status;
SELECT 
  'Tournaments deleted' as item,
  COUNT(*) as should_be_zero
FROM tournaments
UNION ALL
SELECT 
  'Competitions deleted',
  COUNT(*)
FROM tournament_competitions
UNION ALL
SELECT 
  'Entries deleted',
  COUNT(*)
FROM competition_entries;

-- Cleanup script: Remove all old tournament/competition triggers before applying new ones

-- Drop all triggers on tournament_competitions
DROP TRIGGER IF EXISTS sync_competition_times_on_insert ON tournament_competitions;
DROP TRIGGER IF EXISTS sync_competition_times_on_update ON tournament_competitions;
DROP TRIGGER IF EXISTS update_competition_times ON tournament_competitions;
DROP TRIGGER IF EXISTS auto_sync_competition_times ON tournament_competitions;

-- Drop all triggers on tournaments
DROP TRIGGER IF EXISTS update_competitions_on_tournament_lifecycle ON tournaments;
DROP TRIGGER IF EXISTS sync_competitions_on_tournament_change ON tournaments;
DROP TRIGGER IF EXISTS cascade_tournament_times ON tournaments;

-- Drop old functions (if they exist with different signatures)
-- Use CASCADE to drop any triggers that depend on these functions
DROP FUNCTION IF EXISTS sync_competition_from_tournament() CASCADE;
DROP FUNCTION IF EXISTS update_competitions_on_tournament_change() CASCADE;
DROP FUNCTION IF EXISTS cascade_competition_times() CASCADE;

-- Check for any remaining triggers on these tables
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid IN ('tournament_competitions'::regclass, 'tournaments'::regclass)
AND tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
ORDER BY table_name, trigger_name;

-- If any unexpected triggers show up above, drop them manually:
-- DROP TRIGGER IF EXISTS <trigger_name> ON <table_name>;

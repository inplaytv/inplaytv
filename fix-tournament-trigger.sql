-- Fix: Drop the problematic trigger that references non-existent ct.rounds_covered
-- This trigger is outdated - the API now handles competition time updates via 
-- /api/tournaments/[id]/competitions/calculate-times

-- Drop the trigger
DROP TRIGGER IF EXISTS update_competitions_on_tournament_lifecycle ON tournaments;

-- Drop the function as well since it's no longer needed
DROP FUNCTION IF EXISTS update_competitions_on_tournament_change();

-- The API endpoint /api/tournament-lifecycle/[id]/registration already calls
-- /api/tournaments/[id]/competitions/calculate-times after updating the tournament,
-- so this trigger is redundant and was causing the "ct.rounds_covered does not exist" error.

-- Verify the trigger is gone
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'tournaments'
AND tgname = 'update_competitions_on_tournament_lifecycle';

-- Should return 0 rows

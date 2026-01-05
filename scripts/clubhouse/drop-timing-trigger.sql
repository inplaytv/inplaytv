-- ====================================================================
-- DROP TIMING SYNC TRIGGER - Run in Supabase SQL Editor
-- ====================================================================
-- Date: 2026-01-06
-- Reason: Trigger incompatible with round-specific competition timing
-- See: CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md for full explanation
--
-- The trigger was designed assuming all competitions share same timing,
-- but Clubhouse has 5 competitions per event with different round-specific
-- timing requirements (Round 1 closes at round1_tee_time - 15min, 
-- Round 2 closes at round2_tee_time - 15min, etc.)
--
-- The API correctly handles round-specific timing in:
--   - apps/golf/src/app/api/clubhouse/events/route.ts (POST)
--   - apps/golf/src/app/api/clubhouse/events/[id]/route.ts (PUT)
-- ====================================================================

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();

-- Step 3: Verify removal
SELECT 
  'Trigger Removed' AS status,
  NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'clubhouse_event_timing_sync'
      AND tgrelid = 'clubhouse_events'::regclass
  ) AS trigger_gone,
  NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'sync_clubhouse_competition_timing'
  ) AS function_gone;

-- Expected result:
--   status           | trigger_gone | function_gone
--   ----------------|--------------|---------------
--   Trigger Removed | true         | true

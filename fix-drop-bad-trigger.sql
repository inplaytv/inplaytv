-- DROP THE BROKEN TRIGGER THAT OVERWRITES COMPETITION TIMING
-- This trigger was setting ALL competitions to the same closes_at/starts_at
-- which broke the round-specific timing logic

-- Drop the trigger
DROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;

-- Drop the function
DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();

-- Verify it's gone
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'clubhouse_events'::regclass;

COMMENT ON TABLE clubhouse_events IS 
'Competition timing is now managed by API routes only - no auto-sync trigger';

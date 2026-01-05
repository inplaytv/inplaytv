-- Run this in Supabase SQL Editor to check if triggers exist

-- Check all clubhouse triggers
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  CASE tgenabled
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
    ELSE 'unknown'
  END AS status
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid::regclass::text LIKE 'clubhouse%'
  AND NOT tgisinternal
ORDER BY table_name, trigger_name;

-- Check specifically for timing sync trigger
SELECT EXISTS (
  SELECT 1 FROM pg_trigger
  WHERE tgname = 'clubhouse_event_timing_sync'
    AND tgrelid = 'clubhouse_events'::regclass
    AND tgenabled = 'O'
) AS timing_trigger_active;

-- Check if function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc
  WHERE proname = 'sync_clubhouse_competition_timing'
) AS timing_function_exists;

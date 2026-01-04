-- Fix THE NORTHFORLAND OPEN status in Clubhouse
-- The trigger only runs on INSERT/UPDATE, not periodically
-- So we need to manually update or "touch" the record to trigger status recalculation

-- Option 1: Direct status update (safe, immediate)
UPDATE clubhouse_events
SET status = 'open', updated_at = NOW()
WHERE id = '8d0c5630-548e-4767-9837-788fa511182e'
  AND NOW() >= registration_opens_at
  AND NOW() < start_date
  AND status != 'open';

-- Option 2: Trigger the auto-update by touching the record
-- (This re-runs the trigger which will calculate the correct status)
UPDATE clubhouse_events
SET updated_at = NOW()
WHERE id = '8d0c5630-548e-4767-9837-788fa511182e';

-- Verify the fix
SELECT 
  name,
  status,
  registration_opens_at,
  registration_closes_at,
  start_date,
  end_date,
  CASE
    WHEN NOW() < registration_opens_at THEN 'Should be: upcoming'
    WHEN NOW() >= registration_opens_at AND NOW() < start_date THEN 'Should be: open'
    WHEN NOW() >= start_date AND NOW() < end_date THEN 'Should be: active'
    ELSE 'Should be: completed'
  END as expected_status
FROM clubhouse_events
WHERE name ILIKE '%NORTHFORLAND%';

-- Future Solution: Create periodic status updater (like InPlay system)
-- Add this to a cron job or scheduled task:
/*
CREATE OR REPLACE FUNCTION auto_update_clubhouse_event_statuses()
RETURNS TABLE(updated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Just touch all active events to trigger status recalculation
  UPDATE clubhouse_events
  SET updated_at = NOW()
  WHERE status NOT IN ('completed')
    AND is_visible = true;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION auto_update_clubhouse_event_statuses() TO authenticated, service_role;
*/

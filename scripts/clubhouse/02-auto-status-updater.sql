-- Clubhouse Auto-Status Updater RPC Function
-- This function "touches" all non-completed events to trigger status recalculation
-- Should be called by cron job every 5 minutes via /api/clubhouse/auto-update-statuses

CREATE OR REPLACE FUNCTION auto_update_clubhouse_event_statuses()
RETURNS TABLE(updated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Touch all active events to trigger the auto-update trigger
  -- This re-runs update_clubhouse_event_status() which calculates correct status
  UPDATE clubhouse_events
  SET updated_at = NOW()
  WHERE status NOT IN ('completed', 'cancelled')
    AND is_visible = true;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_update_clubhouse_event_statuses() TO authenticated, service_role;

COMMENT ON FUNCTION auto_update_clubhouse_event_statuses() IS 
'Triggers status recalculation for all active Clubhouse events by updating their updated_at timestamp. Called by cron job every 5 minutes.';

-- Also create a function for clubhouse competitions (similar pattern)
CREATE OR REPLACE FUNCTION auto_update_clubhouse_competition_statuses()
RETURNS TABLE(updated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Touch all active competitions to trigger status recalculation
  UPDATE clubhouse_competitions
  SET updated_at = NOW()
  WHERE status NOT IN ('completed', 'cancelled')
    AND EXISTS (
      SELECT 1 FROM clubhouse_events
      WHERE clubhouse_events.id = clubhouse_competitions.event_id
      AND clubhouse_events.is_visible = true
    );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_update_clubhouse_competition_statuses() TO authenticated, service_role;

COMMENT ON FUNCTION auto_update_clubhouse_competition_statuses() IS 
'Triggers status recalculation for all active Clubhouse competitions. Called alongside auto_update_clubhouse_event_statuses().';

-- Test the functions
-- SELECT * FROM auto_update_clubhouse_event_statuses();
-- SELECT * FROM auto_update_clubhouse_competition_statuses();

-- ===================================================================
-- FIX: Timezone-Aware Tournament Status Checks
-- Problem: Status updates use UTC time, but tournaments are in local timezones
-- Solution: Convert NOW() to tournament's timezone before comparing dates
-- ===================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS detect_tournament_status_mismatches();
DROP FUNCTION IF EXISTS auto_update_tournament_statuses();

-- Create improved mismatch detection with timezone support
CREATE OR REPLACE FUNCTION detect_tournament_status_mismatches()
RETURNS TABLE(
  tournament_id UUID,
  tournament_name TEXT,
  current_status TEXT,
  suggested_status TEXT,
  reason TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.status,
    CASE
      -- Convert to tournament timezone for comparison
      -- Tournament ends at 11:59 PM on end_date in local timezone
      WHEN (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date > (t.end_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        THEN 'completed'
      WHEN (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date >= (t.start_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date <= (t.end_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        THEN 'live'
      WHEN (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date < (t.start_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        THEN 'upcoming'
      ELSE t.status
    END as suggested_status,
    CASE
      WHEN (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date > (t.end_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND t.status != 'completed' 
        THEN 'Tournament ended on ' || to_char(t.end_date AT TIME ZONE COALESCE(t.timezone, 'UTC'), 'DD Mon YYYY') || ' but status is "' || t.status || '"'
      WHEN (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date >= (t.start_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date <= (t.end_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND t.status NOT IN ('live', 'reg_closed')
        THEN 'Tournament is currently running but status is "' || t.status || '"'
      WHEN (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date < (t.start_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND t.status IN ('completed', 'live')
        THEN 'Tournament starts on ' || to_char(t.start_date AT TIME ZONE COALESCE(t.timezone, 'UTC'), 'DD Mon YYYY') || ' but status is "' || t.status || '"'
      ELSE 'Status mismatch detected'
    END as reason,
    t.start_date,
    t.end_date
  FROM tournaments t
  WHERE t.status NOT IN ('cancelled')
    AND (
      -- Completed: Day after end_date in local timezone
      ((NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date > (t.end_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND t.status != 'completed')
      OR
      -- Live: Between start and end dates in local timezone
      ((NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date >= (t.start_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND (NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date <= (t.end_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND t.status NOT IN ('live', 'reg_closed'))
      OR
      -- Future: Before start date in local timezone
      ((NOW() AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date < (t.start_date AT TIME ZONE COALESCE(t.timezone, 'UTC'))::date 
        AND t.status IN ('completed', 'live'))
    )
  ORDER BY t.start_date ASC;
END;
$$;

-- Create improved auto-update function with timezone support
CREATE OR REPLACE FUNCTION auto_update_tournament_statuses()
RETURNS TABLE(updated_count INTEGER, updated_tournaments JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_completed_count INTEGER := 0;
  v_live_count INTEGER := 0;
BEGIN
  -- Update to COMPLETED if day is AFTER end_date in tournament timezone
  -- Tournament completes at end of day (11:59 PM) on end_date
  WITH updated AS (
    UPDATE tournaments
    SET status = 'completed', updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled')
      AND (NOW() AT TIME ZONE COALESCE(timezone, 'UTC'))::date > (end_date AT TIME ZONE COALESCE(timezone, 'UTC'))::date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated;

  -- Update to LIVE if current day is between start_date and end_date in tournament timezone
  WITH updated AS (
    UPDATE tournaments
    SET status = 'live', updated_at = NOW()
    WHERE status NOT IN ('live', 'completed', 'cancelled')
      AND (NOW() AT TIME ZONE COALESCE(timezone, 'UTC'))::date >= (start_date AT TIME ZONE COALESCE(timezone, 'UTC'))::date
      AND (NOW() AT TIME ZONE COALESCE(timezone, 'UTC'))::date <= (end_date AT TIME ZONE COALESCE(timezone, 'UTC'))::date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_live_count FROM updated;

  v_updated_count := v_completed_count + v_live_count;

  RETURN QUERY
  SELECT 
    v_updated_count,
    jsonb_build_object(
      'completed', v_completed_count,
      'live', v_live_count,
      'timestamp', NOW()
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION detect_tournament_status_mismatches() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auto_update_tournament_statuses() TO authenticated, service_role;

-- Test the fix
SELECT * FROM detect_tournament_status_mismatches();

-- Explanation:
-- ============
-- Before: NOW() > end_date (compares UTC times)
-- After: (NOW() AT TIME ZONE timezone)::date > (end_date AT TIME ZONE timezone)::date
--
-- This converts both times to the tournament's local timezone, then compares just the dates.
-- Tournament is "live" all day on end_date (until 11:59 PM local time).
-- Tournament becomes "completed" the day AFTER end_date (at 12:00 AM local time).
--
-- Example: RSM Classic in Georgia (America/New_York)
-- - end_date: 2025-11-23
-- - Live until: Nov 23 11:59 PM Eastern
-- - Completed: Nov 24 12:00 AM Eastern

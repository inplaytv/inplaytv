-- ===================================================================
-- AUTOMATED TOURNAMENT STATUS UPDATER
-- Smart status automation with mismatch detection
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: Status Value Conventions
-- -------------------------------------
-- Tournaments use: upcoming, registration_open, registration_closed, 
--                  live_inplay, completed, cancelled
-- Competitions use: draft, upcoming, reg_open, reg_closed, 
--                   live, completed, cancelled
-- ===================================================================

-- Create function to detect status mismatches (suggestions only)
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
      WHEN NOW() > t.end_date THEN 'completed'
      WHEN NOW() >= t.start_date AND NOW() <= t.end_date THEN 'live'
      WHEN NOW() < t.start_date THEN 'upcoming'
      ELSE t.status
    END as suggested_status,
    CASE
      WHEN NOW() > t.end_date AND t.status != 'completed' 
        THEN 'Tournament ended on ' || to_char(t.end_date, 'DD Mon YYYY') || ' but status is "' || t.status || '"'
      WHEN NOW() >= t.start_date AND NOW() <= t.end_date AND t.status NOT IN ('live', 'reg_closed')
        THEN 'Tournament is currently running but status is "' || t.status || '"'
      WHEN NOW() < t.start_date AND t.status IN ('completed', 'live')
        THEN 'Tournament starts on ' || to_char(t.start_date, 'DD Mon YYYY') || ' but status is "' || t.status || '"'
      ELSE 'Status mismatch detected'
    END as reason,
    t.start_date,
    t.end_date
  FROM tournaments t
  WHERE t.status NOT IN ('cancelled')
    AND (
      -- Completed but date is in the future
      (NOW() > t.end_date AND t.status != 'completed')
      OR
      -- Live but not in date range
      (NOW() >= t.start_date AND NOW() <= t.end_date AND t.status NOT IN ('live', 'reg_closed'))
      OR
      -- Future tournament marked as completed/live
      (NOW() < t.start_date AND t.status IN ('completed', 'live'))
    )
  ORDER BY t.start_date ASC;
END;
$$;

-- Create function to automatically update tournament statuses (only forward progression)
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
  -- Update to COMPLETED if past end_date (and not already completed/cancelled)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'completed', updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled')
      AND NOW() > end_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated;

  -- Update to LIVE if between start_date and end_date (and not already live/completed/cancelled)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'live', updated_at = NOW()
    WHERE status NOT IN ('live', 'completed', 'cancelled')
      AND NOW() >= start_date
      AND NOW() <= end_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_live_count FROM updated;

  v_updated_count := v_completed_count + v_live_count;

  -- Return results
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

-- Create function to update competition statuses
CREATE OR REPLACE FUNCTION auto_update_competition_statuses()
RETURNS TABLE(updated_count INTEGER, updated_competitions JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_completed_count INTEGER := 0;
  v_live_count INTEGER := 0;
  v_reg_closed_count INTEGER := 0;
BEGIN
  -- Update competitions to COMPLETED if past end_at
  WITH updated AS (
    UPDATE tournament_competitions
    SET status = 'completed', updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled')
      AND end_at IS NOT NULL
      AND NOW() > end_at
    RETURNING id
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated;

  -- Update competitions to LIVE if between start_at and end_at
  WITH updated AS (
    UPDATE tournament_competitions
    SET status = 'live', updated_at = NOW()
    WHERE status NOT IN ('live', 'completed', 'cancelled')
      AND start_at IS NOT NULL
      AND end_at IS NOT NULL
      AND NOW() >= start_at
      AND NOW() <= end_at
    RETURNING id
  )
  SELECT COUNT(*) INTO v_live_count FROM updated;

  -- Update competitions to REG_CLOSED if past reg_close_at but before start_at
  WITH updated AS (
    UPDATE tournament_competitions
    SET status = 'reg_closed', updated_at = NOW()
    WHERE status NOT IN ('reg_closed', 'live', 'completed', 'cancelled')
      AND reg_close_at IS NOT NULL
      AND NOW() > reg_close_at
      AND (start_at IS NULL OR NOW() < start_at)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_reg_closed_count FROM updated;

  v_updated_count := v_completed_count + v_live_count + v_reg_closed_count;

  -- Return results
  RETURN QUERY
  SELECT 
    v_updated_count,
    jsonb_build_object(
      'completed', v_completed_count,
      'live', v_live_count,
      'reg_closed', v_reg_closed_count,
      'timestamp', NOW()
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION detect_tournament_status_mismatches() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auto_update_tournament_statuses() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auto_update_competition_statuses() TO authenticated, service_role;

-- Add comments
COMMENT ON FUNCTION detect_tournament_status_mismatches() IS 'Detects tournaments with status/date mismatches and returns suggestions';
COMMENT ON FUNCTION auto_update_tournament_statuses() IS 'Automatically updates tournament statuses to completed/live (forward progression only). Call via cron job every 5 minutes.';
COMMENT ON FUNCTION auto_update_competition_statuses() IS 'Automatically updates competition statuses to completed/live/reg_closed based on dates. Call via cron job every 5 minutes.';

-- Test the functions
SELECT * FROM detect_tournament_status_mismatches();
SELECT * FROM auto_update_tournament_statuses();
SELECT * FROM auto_update_competition_statuses();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Smart Status Assistant installed successfully!';
  RAISE NOTICE '📝 Functions created:';
  RAISE NOTICE '  - detect_tournament_status_mismatches() - Shows suggestions';
  RAISE NOTICE '  - auto_update_tournament_statuses() - Auto-updates (forward only)';
  RAISE NOTICE '  - auto_update_competition_statuses() - Auto-updates competitions';
  RAISE NOTICE '🔧 Next steps:';
  RAISE NOTICE '  1. Cron job auto-updates forward progression (upcoming→live→completed)';
  RAISE NOTICE '  2. Admin panel shows mismatch warnings for manual review';
  RAISE NOTICE '  3. You can override any status manually as needed';
END;
$$;

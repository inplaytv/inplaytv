-- ===================================================================
-- FIX: Update auto_update_tournament_statuses() to use correct column names
-- The function was using registration_close_date (wrong) 
-- but the actual column is registration_closes_at
-- ===================================================================

-- Create function to automatically update tournament statuses (FIXED VERSION)
CREATE OR REPLACE FUNCTION auto_update_tournament_statuses()
RETURNS TABLE(updated_count INTEGER, updated_tournaments JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_completed_count INTEGER := 0;
  v_live_count INTEGER := 0;
  v_reg_closed_count INTEGER := 0;
  v_reg_open_count INTEGER := 0;
  v_upcoming_count INTEGER := 0;
BEGIN
  -- 1. Update to COMPLETED if past end_date (and not already completed/cancelled)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'completed', updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled')
      AND NOW() > end_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated;

  -- 2. Update to LIVE if between start_date and end_date (and not already live/completed/cancelled)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'live', updated_at = NOW()
    WHERE status NOT IN ('live', 'completed', 'cancelled')
      AND NOW() >= start_date
      AND NOW() <= end_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_live_count FROM updated;

  -- 3. Update to REGISTRATION_CLOSED if between reg_close and start (and not already in later state)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'registration_closed', updated_at = NOW()
    WHERE status NOT IN ('registration_closed', 'live', 'completed', 'cancelled')
      AND registration_closes_at IS NOT NULL
      AND NOW() >= registration_closes_at
      AND NOW() < start_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_reg_closed_count FROM updated;

  -- 4. Update to REGISTRATION_OPEN if between reg_open and reg_close (and not already in later state)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'registration_open', updated_at = NOW()
    WHERE status NOT IN ('registration_open', 'registration_closed', 'live', 'completed', 'cancelled')
      AND registration_opens_at IS NOT NULL
      AND NOW() >= registration_opens_at
      AND (registration_closes_at IS NULL OR NOW() < registration_closes_at)
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_reg_open_count FROM updated;

  -- 5. Update to UPCOMING if before reg_open (and not already upcoming/cancelled)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'upcoming', updated_at = NOW()
    WHERE status NOT IN ('upcoming', 'cancelled')
      AND (registration_opens_at IS NULL OR NOW() < registration_opens_at)
      AND status IN ('registration_open', 'registration_closed', 'live', 'completed')
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_upcoming_count FROM updated;

  v_updated_count := v_completed_count + v_live_count + v_reg_closed_count + v_reg_open_count + v_upcoming_count;

  -- Return results with detailed breakdown
  RETURN QUERY
  SELECT 
    v_updated_count,
    jsonb_build_object(
      'completed', v_completed_count,
      'live', v_live_count,
      'registration_closed', v_reg_closed_count,
      'registration_open', v_reg_open_count,
      'upcoming', v_upcoming_count,
      'timestamp', NOW()
    );
END;
$$;

-- Test the function
SELECT * FROM auto_update_tournament_statuses();

-- Show what was updated
SELECT 
  id,
  name,
  status,
  start_date,
  end_date,
  registration_opens_at,
  registration_closes_at
FROM tournaments
WHERE name ILIKE '%NORTHFORLAND%';

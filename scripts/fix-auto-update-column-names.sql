-- ===================================================================
-- FIX AUTO-UPDATE FUNCTIONS - CORRECT COLUMN NAMES
-- Problem: Functions reference wrong column names (registration_close_date vs registration_closes_at)
-- Run this in Supabase SQL Editor
-- ===================================================================

-- Drop and recreate auto_update_tournament_statuses with CORRECT column names
DROP FUNCTION IF EXISTS auto_update_tournament_statuses();

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
  -- 1. Update to COMPLETED if past end_date
  WITH updated AS (
    UPDATE tournaments
    SET status = 'completed', updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled')
      AND NOW() > end_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated;

  -- 2. Update to LIVE if between start_date and end_date
  WITH updated AS (
    UPDATE tournaments
    SET status = 'live', updated_at = NOW()
    WHERE status NOT IN ('live', 'completed', 'cancelled')
      AND NOW() >= start_date
      AND NOW() <= end_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_live_count FROM updated;

  -- 3. Update to REGISTRATION_CLOSED if between reg_close and start
  -- FIXED: registration_closes_at (not registration_close_date)
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

  -- 4. Update to REGISTRATION_OPEN if between reg_open and reg_close
  -- FIXED: registration_opens_at and registration_closes_at (not _date)
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

  -- 5. Update to UPCOMING if before reg_open
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_update_tournament_statuses() TO authenticated, service_role;

COMMENT ON FUNCTION auto_update_tournament_statuses() IS 'Automatically updates tournament statuses through FULL lifecycle: upcoming → registration_open → registration_closed → live → completed. Uses correct column names: registration_opens_at and registration_closes_at.';

-- Also update auto_update_competition_statuses to handle draft->upcoming transition
DROP FUNCTION IF EXISTS auto_update_competition_statuses();

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
  v_reg_open_count INTEGER := 0;
BEGIN
  -- 1. Update competitions to COMPLETED if past end_at
  WITH updated AS (
    UPDATE tournament_competitions
    SET status = 'completed', updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled')
      AND end_at IS NOT NULL
      AND NOW() > end_at
    RETURNING id
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated;

  -- 2. Update competitions to LIVE if between start_at and end_at
  WITH updated AS (
    UPDATE tournament_competitions
    SET status = 'live', updated_at = NOW()
    WHERE status NOT IN ('live', 'completed', 'cancelled')
      AND start_at IS NOT NULL
      AND NOW() >= start_at
      AND (end_at IS NULL OR NOW() <= end_at)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_live_count FROM updated;

  -- 3. Update competitions to REG_CLOSED if past reg_close_at but before start_at
  WITH updated AS (
    UPDATE tournament_competitions
    SET status = 'reg_closed', updated_at = NOW()
    WHERE status NOT IN ('reg_closed', 'live', 'completed', 'cancelled')
      AND reg_close_at IS NOT NULL
      AND NOW() >= reg_close_at
      AND (start_at IS NULL OR NOW() < start_at)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_reg_closed_count FROM updated;

  -- 4. Update competitions from DRAFT to REG_OPEN if reg_open_at has passed
  -- This is the key missing piece for draft competitions!
  WITH updated AS (
    UPDATE tournament_competitions
    SET status = 'reg_open', updated_at = NOW()
    WHERE status IN ('draft', 'upcoming')
      AND reg_open_at IS NOT NULL
      AND NOW() >= reg_open_at
      AND (reg_close_at IS NULL OR NOW() < reg_close_at)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_reg_open_count FROM updated;

  v_updated_count := v_completed_count + v_live_count + v_reg_closed_count + v_reg_open_count;

  -- Return results with detailed breakdown
  RETURN QUERY
  SELECT 
    v_updated_count,
    jsonb_build_object(
      'completed', v_completed_count,
      'live', v_live_count,
      'reg_closed', v_reg_closed_count,
      'reg_open', v_reg_open_count,
      'timestamp', NOW()
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_update_competition_statuses() TO authenticated, service_role;

COMMENT ON FUNCTION auto_update_competition_statuses() IS 'Automatically updates competition statuses: draft/upcoming → reg_open → reg_closed → live → completed. Transitions draft competitions to reg_open when registration opens.';

-- Test the functions
SELECT 'Tournament status updates:' as info, * FROM auto_update_tournament_statuses();
SELECT 'Competition status updates:' as info, * FROM auto_update_competition_statuses();

-- Show what changed
SELECT 
  'Tournaments that should be registration_open:' as info,
  COUNT(*) as count
FROM tournaments
WHERE status != 'registration_open'
  AND registration_opens_at IS NOT NULL
  AND NOW() >= registration_opens_at
  AND (registration_closes_at IS NULL OR NOW() < registration_closes_at);

SELECT 
  'Competitions in draft that should be reg_open:' as info,
  COUNT(*) as count
FROM tournament_competitions
WHERE status = 'draft'
  AND reg_open_at IS NOT NULL
  AND NOW() >= reg_open_at;

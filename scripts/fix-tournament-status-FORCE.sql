-- ===================================================================
-- FORCE FIX: Tournament Status Lifecycle - No Constraint Checks
-- This version uses a transaction to force the constraint removal
-- ===================================================================

BEGIN;

-- FORCE drop the constraint (no IF EXISTS)
ALTER TABLE public.tournaments DROP CONSTRAINT tournaments_status_check;

-- Add registration columns if missing
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_open_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_close_date TIMESTAMPTZ;

-- Set default registration dates
UPDATE public.tournaments
SET 
  registration_open_date = COALESCE(registration_open_date, start_date - INTERVAL '10 days'),
  registration_close_date = COALESCE(registration_close_date, start_date - INTERVAL '15 minutes')
WHERE registration_open_date IS NULL OR registration_close_date IS NULL;

-- Convert reg_open to registration_open
UPDATE public.tournaments
SET status = 'registration_open'
WHERE status = 'reg_open';

-- Add new constraint with all lifecycle states
ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'));

-- Set NOT NULL on registration columns
ALTER TABLE public.tournaments 
ALTER COLUMN registration_open_date SET NOT NULL,
ALTER COLUMN registration_close_date SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_open ON public.tournaments(registration_open_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_close ON public.tournaments(registration_close_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_status_dates ON public.tournaments(status, start_date, end_date);

COMMIT;

-- Now update the functions (outside transaction)
DROP FUNCTION IF EXISTS detect_tournament_status_mismatches();
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
      WHEN t.registration_close_date IS NOT NULL 
        AND NOW() >= t.registration_close_date 
        AND NOW() < t.start_date 
        THEN 'registration_closed'
      WHEN t.registration_open_date IS NOT NULL 
        AND NOW() >= t.registration_open_date 
        AND (t.registration_close_date IS NULL OR NOW() < t.registration_close_date)
        THEN 'registration_open'
      WHEN t.registration_open_date IS NULL OR NOW() < t.registration_open_date 
        THEN 'upcoming'
      ELSE t.status
    END as suggested_status,
    CASE
      WHEN NOW() > t.end_date AND t.status != 'completed' 
        THEN 'Tournament ended but status is "' || t.status || '"'
      WHEN NOW() >= t.start_date AND NOW() <= t.end_date AND t.status != 'live'
        THEN 'Tournament is live but status is "' || t.status || '"'
      WHEN t.registration_close_date IS NOT NULL 
        AND NOW() >= t.registration_close_date 
        AND NOW() < t.start_date 
        AND t.status != 'registration_closed'
        THEN 'Registration closed but status is "' || t.status || '"'
      WHEN t.registration_open_date IS NOT NULL 
        AND NOW() >= t.registration_open_date 
        AND (t.registration_close_date IS NULL OR NOW() < t.registration_close_date)
        AND t.status != 'registration_open'
        THEN 'Registration open but status is "' || t.status || '"'
      WHEN NOW() < COALESCE(t.registration_open_date, t.start_date) AND t.status IN ('completed', 'live', 'registration_open', 'registration_closed')
        THEN 'Tournament upcoming but status is "' || t.status || '"'
      ELSE 'Status mismatch detected'
    END as reason,
    t.start_date,
    t.end_date
  FROM tournaments t
  WHERE t.status NOT IN ('cancelled')
    AND (
      (NOW() > t.end_date AND t.status != 'completed')
      OR (NOW() >= t.start_date AND NOW() <= t.end_date AND t.status != 'live')
      OR (t.registration_close_date IS NOT NULL 
        AND NOW() >= t.registration_close_date 
        AND NOW() < t.start_date 
        AND t.status != 'registration_closed')
      OR (t.registration_open_date IS NOT NULL 
        AND NOW() >= t.registration_open_date 
        AND (t.registration_close_date IS NULL OR NOW() < t.registration_close_date)
        AND t.status != 'registration_open')
      OR ((t.registration_open_date IS NULL OR NOW() < t.registration_open_date)
        AND t.status IN ('completed', 'live', 'registration_open', 'registration_closed'))
    )
  ORDER BY t.start_date ASC;
END;
$$;

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
  -- 1. Update to COMPLETED
  WITH updated AS (
    UPDATE tournaments
    SET status = 'completed', updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled')
      AND NOW() > end_date
    RETURNING id
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated;

  -- 2. Update to LIVE
  WITH updated AS (
    UPDATE tournaments
    SET status = 'live', updated_at = NOW()
    WHERE status NOT IN ('live', 'completed', 'cancelled')
      AND NOW() >= start_date
      AND NOW() <= end_date
    RETURNING id
  )
  SELECT COUNT(*) INTO v_live_count FROM updated;

  -- 3. Update to REGISTRATION_CLOSED
  WITH updated AS (
    UPDATE tournaments
    SET status = 'registration_closed', updated_at = NOW()
    WHERE status NOT IN ('registration_closed', 'live', 'completed', 'cancelled')
      AND registration_close_date IS NOT NULL
      AND NOW() >= registration_close_date
      AND NOW() < start_date
    RETURNING id
  )
  SELECT COUNT(*) INTO v_reg_closed_count FROM updated;

  -- 4. Update to REGISTRATION_OPEN
  WITH updated AS (
    UPDATE tournaments
    SET status = 'registration_open', updated_at = NOW()
    WHERE status NOT IN ('registration_open', 'registration_closed', 'live', 'completed', 'cancelled')
      AND registration_open_date IS NOT NULL
      AND NOW() >= registration_open_date
      AND (registration_close_date IS NULL OR NOW() < registration_close_date)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_reg_open_count FROM updated;

  -- 5. Update to UPCOMING
  WITH updated AS (
    UPDATE tournaments
    SET status = 'upcoming', updated_at = NOW()
    WHERE status NOT IN ('upcoming', 'cancelled')
      AND (registration_open_date IS NULL OR NOW() < registration_open_date)
      AND status IN ('registration_open', 'registration_closed', 'live', 'completed')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_upcoming_count FROM updated;

  v_updated_count := v_completed_count + v_live_count + v_reg_closed_count + v_reg_open_count + v_upcoming_count;

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

GRANT EXECUTE ON FUNCTION detect_tournament_status_mismatches() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auto_update_tournament_statuses() TO authenticated, service_role;

-- Run update and show results
SELECT * FROM auto_update_tournament_statuses();
SELECT * FROM detect_tournament_status_mismatches();

SELECT '✅ Tournament lifecycle fix applied successfully!' as status;

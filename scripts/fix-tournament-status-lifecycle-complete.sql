-- ===================================================================
-- FIX TOURNAMENT STATUS LIFECYCLE - COMPLETE
-- Permanent fix for tournament status progression including registration phases
-- Date: November 27, 2025
-- 
-- FIXES: BMW Australian PGA Championship status mismatch
-- ISSUE: Tournament shows as "live" but settings show "upcoming"
-- ROOT CAUSE: auto_update_tournament_statuses() doesn't check registration dates
-- 
-- LIFECYCLE STATES:
-- 1. upcoming → (7+ days before start_date)
-- 2. registration_open → (registration_open_date reached)
-- 3. registration_closed → (registration_close_date reached)
-- 4. live → (start_date reached)
-- 5. completed → (end_date reached)
-- ===================================================================

-- STEP 1: Ensure registration date columns exist
-- ===================================================================
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_open_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_close_date TIMESTAMPTZ;

-- Update existing tournaments to have default registration dates if NULL
-- Registration opens 10 days before start, closes 15 minutes before start
UPDATE public.tournaments
SET 
  registration_open_date = COALESCE(registration_open_date, start_date - INTERVAL '10 days'),
  registration_close_date = COALESCE(registration_close_date, start_date - INTERVAL '15 minutes')
WHERE registration_open_date IS NULL OR registration_close_date IS NULL;

-- STEP 2: Drop constraint FIRST (before status migration)
-- ===================================================================
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_status_check;

-- STEP 3: Convert status values (now safe without constraint)
-- ===================================================================
-- Your database currently has: completed, live, reg_open
-- Only reg_open needs to be converted
UPDATE public.tournaments
SET status = 'registration_open'
WHERE status = 'reg_open';

-- STEP 4: Now apply the new constraint (after status migration complete)
-- ===================================================================
ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'));

-- STEP 5: Set NOT NULL and create indexes
-- ===================================================================
-- Make registration dates NOT NULL (only if not already set)
DO $$
BEGIN
  -- Check if column is already NOT NULL, if not, make it NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournaments' 
    AND column_name = 'registration_open_date' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.tournaments ALTER COLUMN registration_open_date SET NOT NULL;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournaments' 
    AND column_name = 'registration_close_date' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.tournaments ALTER COLUMN registration_close_date SET NOT NULL;
  END IF;
END $$;

-- Create indexes for registration dates
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_open 
ON public.tournaments(registration_open_date);

CREATE INDEX IF NOT EXISTS idx_tournaments_registration_close 
ON public.tournaments(registration_close_date);

CREATE INDEX IF NOT EXISTS idx_tournaments_status_dates 
ON public.tournaments(status, start_date, end_date);

-- STEP 6: Update status detection and auto-update functions
-- ===================================================================

-- Drop and recreate detect_tournament_status_mismatches with registration support
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
      -- Completed: past end_date
      WHEN NOW() > t.end_date THEN 'completed'
      
      -- Live: between start_date and end_date
      WHEN NOW() >= t.start_date AND NOW() <= t.end_date THEN 'live'
      
      -- Registration Closed: between registration_close_date and start_date
      WHEN t.registration_close_date IS NOT NULL 
        AND NOW() >= t.registration_close_date 
        AND NOW() < t.start_date 
        THEN 'registration_closed'
      
      -- Registration Open: between registration_open_date and registration_close_date
      WHEN t.registration_open_date IS NOT NULL 
        AND NOW() >= t.registration_open_date 
        AND (t.registration_close_date IS NULL OR NOW() < t.registration_close_date)
        THEN 'registration_open'
      
      -- Upcoming: before registration_open_date
      WHEN t.registration_open_date IS NULL OR NOW() < t.registration_open_date 
        THEN 'upcoming'
      
      ELSE t.status
    END as suggested_status,
    CASE
      WHEN NOW() > t.end_date AND t.status != 'completed' 
        THEN 'Tournament ended on ' || to_char(t.end_date, 'DD Mon YYYY') || ' but status is "' || t.status || '"'
      
      WHEN NOW() >= t.start_date AND NOW() <= t.end_date AND t.status != 'live'
        THEN 'Tournament is currently running but status is "' || t.status || '"'
      
      WHEN t.registration_close_date IS NOT NULL 
        AND NOW() >= t.registration_close_date 
        AND NOW() < t.start_date 
        AND t.status != 'registration_closed'
        THEN 'Registration closed on ' || to_char(t.registration_close_date, 'DD Mon YYYY HH24:MI') || ' but status is "' || t.status || '"'
      
      WHEN t.registration_open_date IS NOT NULL 
        AND NOW() >= t.registration_open_date 
        AND (t.registration_close_date IS NULL OR NOW() < t.registration_close_date)
        AND t.status != 'registration_open'
        THEN 'Registration opened on ' || to_char(t.registration_open_date, 'DD Mon YYYY') || ' but status is "' || t.status || '"'
      
      WHEN NOW() < COALESCE(t.registration_open_date, t.start_date) AND t.status IN ('completed', 'live', 'registration_open', 'registration_closed')
        THEN 'Tournament starts on ' || to_char(t.start_date, 'DD Mon YYYY') || ' but status is "' || t.status || '"'
      
      ELSE 'Status mismatch detected'
    END as reason,
    t.start_date,
    t.end_date
  FROM tournaments t
  WHERE t.status NOT IN ('cancelled')
    AND (
      -- Tournament should be completed
      (NOW() > t.end_date AND t.status != 'completed')
      OR
      -- Tournament should be live
      (NOW() >= t.start_date AND NOW() <= t.end_date AND t.status != 'live')
      OR
      -- Tournament should be registration_closed
      (t.registration_close_date IS NOT NULL 
        AND NOW() >= t.registration_close_date 
        AND NOW() < t.start_date 
        AND t.status != 'registration_closed')
      OR
      -- Tournament should be registration_open
      (t.registration_open_date IS NOT NULL 
        AND NOW() >= t.registration_open_date 
        AND (t.registration_close_date IS NULL OR NOW() < t.registration_close_date)
        AND t.status != 'registration_open')
      OR
      -- Tournament should be upcoming
      ((t.registration_open_date IS NULL OR NOW() < t.registration_open_date)
        AND t.status IN ('completed', 'live', 'registration_open', 'registration_closed'))
    )
  ORDER BY t.start_date ASC;
END;
$$;

-- Drop and recreate auto_update_tournament_statuses with FULL lifecycle support
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
      AND registration_close_date IS NOT NULL
      AND NOW() >= registration_close_date
      AND NOW() < start_date
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_reg_closed_count FROM updated;

  -- 4. Update to REGISTRATION_OPEN if between reg_open and reg_close (and not already in later state)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'registration_open', updated_at = NOW()
    WHERE status NOT IN ('registration_open', 'registration_closed', 'live', 'completed', 'cancelled')
      AND registration_open_date IS NOT NULL
      AND NOW() >= registration_open_date
      AND (registration_close_date IS NULL OR NOW() < registration_close_date)
    RETURNING id, name, status
  )
  SELECT COUNT(*) INTO v_reg_open_count FROM updated;

  -- 5. Update to UPCOMING if before reg_open (and not already upcoming/cancelled)
  WITH updated AS (
    UPDATE tournaments
    SET status = 'upcoming', updated_at = NOW()
    WHERE status NOT IN ('upcoming', 'cancelled')
      AND (registration_open_date IS NULL OR NOW() < registration_open_date)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION detect_tournament_status_mismatches() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auto_update_tournament_statuses() TO authenticated, service_role;

-- Add comments
COMMENT ON FUNCTION detect_tournament_status_mismatches() IS 'Detects tournaments with status/date mismatches including registration phases and returns suggestions';
COMMENT ON FUNCTION auto_update_tournament_statuses() IS 'Automatically updates tournament statuses through FULL lifecycle: upcoming → registration_open → registration_closed → live → completed. Call via cron job every 5 minutes.';

-- Run immediate update to fix current mismatches
SELECT * FROM auto_update_tournament_statuses();

-- Show any remaining mismatches
SELECT * FROM detect_tournament_status_mismatches();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tournament Lifecycle Status System - COMPLETE FIX applied!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Fixed Functions:';
  RAISE NOTICE '  - detect_tournament_status_mismatches() - Now checks ALL lifecycle states';
  RAISE NOTICE '  - auto_update_tournament_statuses() - Now updates through FULL lifecycle';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Full Lifecycle Progression:';
  RAISE NOTICE '  1. upcoming → (before registration_open_date)';
  RAISE NOTICE '  2. registration_open → (registration_open_date reached)';
  RAISE NOTICE '  3. registration_closed → (registration_close_date reached)';
  RAISE NOTICE '  4. live → (start_date reached)';
  RAISE NOTICE '  5. completed → (end_date reached)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ BMW Australian PGA Championship and all future tournaments will now';
  RAISE NOTICE '   automatically progress through registration phases correctly.';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Auto-update runs every 2 minutes via admin panel (already configured)';
END;
$$;

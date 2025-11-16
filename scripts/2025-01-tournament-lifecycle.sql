-- ===================================================================
-- TOURNAMENT LIFECYCLE MANAGEMENT SYSTEM
-- Run this in Supabase Dashboard SQL Editor
-- Adds lifecycle status management and automatic status transitions
-- ===================================================================

-- Step 1: Add new date columns for lifecycle management
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_open_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_close_date TIMESTAMPTZ;

-- Step 2: Drop existing status constraint and recreate with new values
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'live_inplay', 'completed', 'cancelled'));

-- Step 3: Update existing tournaments to have default registration dates if NULL
-- Registration opens 30 days before start, closes 1 hour before start
UPDATE public.tournaments
SET 
  registration_open_date = COALESCE(registration_open_date, start_date - INTERVAL '30 days'),
  registration_close_date = COALESCE(registration_close_date, start_date - INTERVAL '1 hour')
WHERE registration_open_date IS NULL OR registration_close_date IS NULL;

-- Step 4: Make registration dates NOT NULL after setting defaults
ALTER TABLE public.tournaments 
ALTER COLUMN registration_open_date SET NOT NULL,
ALTER COLUMN registration_close_date SET NOT NULL;

-- Step 5: Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_open 
ON public.tournaments(registration_open_date);

CREATE INDEX IF NOT EXISTS idx_tournaments_registration_close 
ON public.tournaments(registration_close_date);

CREATE INDEX IF NOT EXISTS idx_tournaments_status_dates 
ON public.tournaments(status, start_date, end_date);

-- Step 6: Create function to automatically update tournament status based on dates
CREATE OR REPLACE FUNCTION update_tournament_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update to COMPLETED if past end_date
  UPDATE public.tournaments
  SET status = 'completed', updated_at = NOW()
  WHERE status != 'cancelled' 
    AND status != 'completed'
    AND NOW() >= end_date;

  -- Update to LIVE_INPLAY if past start_date but before end_date
  UPDATE public.tournaments
  SET status = 'live_inplay', updated_at = NOW()
  WHERE status != 'cancelled' 
    AND status != 'completed'
    AND status != 'live_inplay'
    AND NOW() >= start_date 
    AND NOW() < end_date;

  -- Update to REGISTRATION_CLOSED if past registration_close_date but before start_date
  UPDATE public.tournaments
  SET status = 'registration_closed', updated_at = NOW()
  WHERE status != 'cancelled' 
    AND status != 'completed'
    AND status != 'live_inplay'
    AND status != 'registration_closed'
    AND NOW() >= registration_close_date 
    AND NOW() < start_date;

  -- Update to REGISTRATION_OPEN if past registration_open_date but before registration_close_date
  UPDATE public.tournaments
  SET status = 'registration_open', updated_at = NOW()
  WHERE status != 'cancelled' 
    AND status != 'completed'
    AND status != 'live_inplay'
    AND status != 'registration_closed'
    AND status != 'registration_open'
    AND NOW() >= registration_open_date 
    AND NOW() < registration_close_date;

  -- Update to UPCOMING if before registration_open_date
  UPDATE public.tournaments
  SET status = 'upcoming', updated_at = NOW()
  WHERE status != 'cancelled' 
    AND status != 'completed'
    AND status != 'upcoming'
    AND NOW() < registration_open_date;

  RAISE NOTICE 'Tournament statuses updated successfully';
END;
$$;

-- Step 7: Grant execute permission to authenticated users (for API calls)
GRANT EXECUTE ON FUNCTION update_tournament_status() TO authenticated;

-- Step 8: Add comments for documentation
COMMENT ON COLUMN public.tournaments.registration_open_date IS 'Date when registration opens for this tournament';
COMMENT ON COLUMN public.tournaments.registration_close_date IS 'Date when registration closes for this tournament';
COMMENT ON FUNCTION update_tournament_status() IS 'Automatically updates tournament statuses based on current date/time. Run this via cron job every 2 minutes.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tournament Lifecycle Management System installed successfully!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '  1. Call update_tournament_status() function via API cron job every 2 minutes';
  RAISE NOTICE '  2. Use the admin UI to manually override statuses when needed';
  RAISE NOTICE '  3. Set registration_open_date and registration_close_date when creating tournaments';
END;
$$;

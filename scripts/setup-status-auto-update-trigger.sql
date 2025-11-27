-- ===================================================================
-- SETUP: Automatic Tournament Status Updates
-- Creates a cron job to run status updates every hour
-- ===================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists (ignore error if job doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-update-tournament-statuses');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create cron job to run every hour
SELECT cron.schedule(
  'auto-update-tournament-statuses',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT auto_update_tournament_statuses();$$
);

-- Manually run it now to fix current issues
SELECT auto_update_tournament_statuses();

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'auto-update-tournament-statuses';

-- Explanation:
-- ============
-- This creates a cron job that runs auto_update_tournament_statuses() every hour.
-- The function will automatically update tournament statuses based on timezone-aware logic.
-- 
-- Note: pg_cron might not be available in all Supabase plans.
-- If you get an error, you can manually run auto_update_tournament_statuses() 
-- or call it from your application code periodically.

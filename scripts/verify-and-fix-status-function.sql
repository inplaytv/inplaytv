-- ===================================================================
-- VERIFY AND FIX: Check if timezone function is actually in database
-- Then manually set RSM Classic to 'live' and disable auto-update temporarily
-- ===================================================================

-- First, let's see what the function thinks
SELECT * FROM detect_tournament_status_mismatches();

-- Check if tournament should be live or completed in Eastern time
SELECT 
  name,
  timezone,
  end_date,
  (NOW() AT TIME ZONE timezone)::date as current_date_local,
  (end_date AT TIME ZONE timezone)::date as end_date_local,
  (NOW() AT TIME ZONE timezone)::date > (end_date AT TIME ZONE timezone)::date as should_be_completed,
  status
FROM tournaments 
WHERE slug = 'the-rsm-classic';

-- Force set to 'live' regardless
UPDATE tournaments
SET status = 'live', updated_at = NOW()
WHERE slug = 'the-rsm-classic';

-- Temporarily disable the cron job to prevent it from changing back
SELECT cron.unschedule('auto-update-tournament-statuses');

-- Verify status is now live
SELECT name, status, timezone FROM tournaments WHERE slug = 'the-rsm-classic';

-- Explanation:
-- ============
-- This will:
-- 1. Check what the mismatch detection thinks
-- 2. Show the date comparison logic
-- 3. Force set status to 'live'
-- 4. Disable the cron job temporarily
-- 
-- The cron job is changing it back to 'completed' because either:
-- a) The function wasn't properly updated in the database, OR
-- b) The end_date is being interpreted incorrectly

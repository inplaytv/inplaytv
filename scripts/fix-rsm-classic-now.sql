-- ===================================================================
-- IMMEDIATE FIX: RSM Classic Status and Sample Tee Times
-- Run this in Supabase SQL Editor to fix the current issues
-- ===================================================================

-- 1. Fix status to "live" (it's still Nov 23 in Eastern time)
UPDATE tournaments
SET status = 'live', updated_at = NOW()
WHERE slug = 'the-rsm-classic'
  AND (NOW() AT TIME ZONE COALESCE(timezone, 'UTC'))::date <= (end_date AT TIME ZONE COALESCE(timezone, 'UTC'))::date;

-- 2. Add sample tee times for testing (typical PGA Tour times)
-- Round 4 would typically start around 8:00 AM Eastern for a Sunday finish
UPDATE tournaments
SET 
  round1_tee_time = (start_date AT TIME ZONE timezone + INTERVAL '0 days 08:00:00')::timestamptz,
  round2_tee_time = (start_date AT TIME ZONE timezone + INTERVAL '1 day 08:00:00')::timestamptz,
  round3_tee_time = (start_date AT TIME ZONE timezone + INTERVAL '2 days 08:00:00')::timestamptz,
  round4_tee_time = (start_date AT TIME ZONE timezone + INTERVAL '3 days 10:00:00')::timestamptz,
  updated_at = NOW()
WHERE slug = 'the-rsm-classic';

-- 3. Verify the changes
SELECT 
  id,
  name,
  status,
  timezone,
  start_date,
  end_date,
  round1_tee_time AT TIME ZONE timezone as r1_local,
  round2_tee_time AT TIME ZONE timezone as r2_local,
  round3_tee_time AT TIME ZONE timezone as r3_local,
  round4_tee_time AT TIME ZONE timezone as r4_local
FROM tournaments
WHERE slug = 'the-rsm-classic';

-- Explanation:
-- ============
-- Status: Changed to "live" because it's still Nov 23 in Eastern time (3:47 AM)
-- Tee Times: Added typical PGA Tour tee times:
--   - Rounds 1-3: 8:00 AM local time
--   - Round 4: 10:00 AM local time (Sunday morning finish)
-- 
-- These are sample times for testing. Real tee times would come from DataGolf
-- when you sync golfers for future tournaments.

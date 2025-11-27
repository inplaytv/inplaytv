-- ===================================================================
-- FIX: RSM Classic Tee Times - Correct Calculation
-- Problem: Tee times showing as 3am/5am UTC instead of proper local times
-- Solution: Set realistic tee times for each round in Eastern timezone
-- ===================================================================

-- Update with realistic PGA Tour tee times
-- Rounds 1-2: Thursday-Friday, 8:00 AM - 2:00 PM shotgun starts
-- Rounds 3-4: Saturday-Sunday, 10:00 AM - 3:00 PM tee times (paired groups)
UPDATE tournaments
SET 
  round1_tee_time = '2025-11-20 08:00:00-05'::timestamptz,  -- Thursday 8 AM EST
  round2_tee_time = '2025-11-21 08:00:00-05'::timestamptz,  -- Friday 8 AM EST
  round3_tee_time = '2025-11-22 10:00:00-05'::timestamptz,  -- Saturday 10 AM EST
  round4_tee_time = '2025-11-23 10:00:00-05'::timestamptz,  -- Sunday 10 AM EST
  status = 'live',  -- Also fix status since it's still Nov 23
  updated_at = NOW()
WHERE slug = 'the-rsm-classic';

-- Verify the times in both UTC and local
SELECT 
  name,
  status,
  timezone,
  round1_tee_time as r1_utc,
  round1_tee_time AT TIME ZONE timezone as r1_local,
  round2_tee_time as r2_utc,
  round2_tee_time AT TIME ZONE timezone as r2_local,
  round3_tee_time as r3_utc,
  round3_tee_time AT TIME ZONE timezone as r3_local,
  round4_tee_time as r4_utc,
  round4_tee_time AT TIME ZONE timezone as r4_local
FROM tournaments
WHERE slug = 'the-rsm-classic';

-- Explanation:
-- ============
-- Tee times are stored as TIMESTAMPTZ (timezone-aware)
-- Format: 'YYYY-MM-DD HH:MM:SS-05' where -05 is EST offset
-- These will display correctly in the admin UI
-- Registration closes 15 minutes before each tee time

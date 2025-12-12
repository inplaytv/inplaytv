-- ===================================================================
-- FIX: Alfred Dunhill Championship - Correct Timezone
-- Tournament in Johannesburg should use Africa/Johannesburg timezone
-- ===================================================================

-- Fix the timezone
UPDATE tournaments
SET 
  timezone = 'Africa/Johannesburg',
  updated_at = NOW()
WHERE id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Verify the fix
SELECT 
  name,
  location,
  timezone,
  status,
  start_date,
  end_date,
  round1_tee_time,
  round2_tee_time,
  round3_tee_time,
  round4_tee_time
FROM tournaments
WHERE id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

-- Expected: timezone should now be 'Africa/Johannesburg'

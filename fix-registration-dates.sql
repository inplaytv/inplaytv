-- Fix registration close dates for Clubhouse events
-- Registration should close 15 minutes before LAST ROUND TEE-OFF (e.g., round4_tee_time), not start_date or end_date

-- Check current data
SELECT 
  name,
  start_date,
  end_date,
  round4_tee_time,
  registration_closes_at,
  status
FROM clubhouse_events
ORDER BY created_at DESC;

-- Step 1: Drop the incorrect constraint
ALTER TABLE clubhouse_events DROP CONSTRAINT IF EXISTS valid_registration_window;

-- Step 2: Set registration_closes_at to 15 minutes before last round tee-off
-- Use round4_tee_time as the last round (or round3/2 if those don't exist)
UPDATE clubhouse_events
SET registration_closes_at = COALESCE(
  round4_tee_time - INTERVAL '15 minutes',
  round3_tee_time - INTERVAL '15 minutes',
  round2_tee_time - INTERVAL '15 minutes',
  round1_tee_time - INTERVAL '15 minutes'
);

-- Step 3: Add correct constraint (registration must close before event ends)
ALTER TABLE clubhouse_events 
ADD CONSTRAINT valid_registration_window 
CHECK (registration_closes_at <= end_date);

-- Verify the fix
SELECT 
  name,
  start_date,
  end_date,
  registration_closes_at,
  status,
  CASE 
    WHEN NOW() < registration_closes_at THEN 'REG OPEN'
    ELSE 'REG CLOSED'
  END as reg_status
FROM clubhouse_events
ORDER BY created_at DESC;

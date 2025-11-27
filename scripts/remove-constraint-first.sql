-- ===================================================================
-- STEP 1: Remove Old Constraint and Convert Status Values
-- Run this FIRST before the main fix script
-- ===================================================================

-- Drop the problematic constraint completely
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;

-- Convert reg_open to registration_open
UPDATE public.tournaments
SET status = 'registration_open'
WHERE status = 'reg_open';

-- Verify status values
SELECT 
  status,
  COUNT(*) as count
FROM public.tournaments
GROUP BY status
ORDER BY count DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Constraint removed and status values converted!';
  RAISE NOTICE 'Now you can run the main fix script: fix-tournament-status-lifecycle-complete.sql';
END $$;

-- ============================================================================
-- STANDARDIZE STATUS VALUES - COMPLETE FIX
-- ============================================================================
-- This standardizes all status values to use:
-- - registration_open (not reg_open)
-- - registration_closed (not reg_closed)
-- ============================================================================

-- Step 1: Update existing competition data
UPDATE tournament_competitions
SET status = 'registration_open'
WHERE status = 'reg_open';

UPDATE tournament_competitions
SET status = 'registration_closed'
WHERE status = 'reg_closed';

-- Step 2: Update the constraint to remove old values
ALTER TABLE tournament_competitions
DROP CONSTRAINT IF EXISTS tournament_competitions_status_check CASCADE;

ALTER TABLE tournament_competitions
ADD CONSTRAINT tournament_competitions_status_check 
CHECK (status IN (
  -- Standard tournament/competition statuses
  'draft',
  'upcoming',
  'registration_open',    -- STANDARDIZED (was reg_open)
  'registration_closed',  -- STANDARDIZED (was reg_closed)
  'live',
  'completed',
  'cancelled',
  -- ONE 2 ONE specific statuses
  'pending',
  'open',
  'full'
));

-- Step 3: Verify the changes
SELECT 
  '✅ AFTER FIX - Competition Statuses' as info,
  status,
  COUNT(*) as count
FROM tournament_competitions
GROUP BY status
ORDER BY status;

SELECT 
  '✅ AFTER FIX - Tournament Statuses' as info,
  status,
  COUNT(*) as count
FROM tournaments
GROUP BY status
ORDER BY status;

-- Done!
SELECT '✅ DATABASE STANDARDIZED' as status;
SELECT 'All competitions now use: registration_open, registration_closed' as info;

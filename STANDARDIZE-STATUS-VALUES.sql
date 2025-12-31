-- ============================================================================
-- STANDARDIZE STATUS VALUES
-- Fix inconsistency between tournament and competition statuses
-- ============================================================================

-- Current problem:
-- - Tournaments use: "registration_open"
-- - Competitions use: "reg_open" 
-- This causes confusion and potential bugs

-- SOLUTION: Standardize competitions to match tournament statuses

-- Step 1: Update competition statuses to match tournament format
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
  'draft',              -- Competition created but not ready
  'upcoming',           -- Scheduled but registration hasn't opened
  'registration_open',  -- Users can register (STANDARDIZED)
  'registration_closed',-- Registration ended, waiting for start (STANDARDIZED)
  'live',              -- Competition in progress
  'completed',         -- Finished
  'cancelled',         -- Cancelled
  -- ONE 2 ONE specific statuses:
  'pending',           -- ONE 2 ONE waiting for creator's entry
  'open',              -- ONE 2 ONE waiting for 2nd player
  'full'               -- ONE 2 ONE has 2 players
));

-- Step 3: Verify the fix
SELECT 
  'AFTER FIX - Competition Statuses:' as info,
  status,
  COUNT(*) as count
FROM tournament_competitions
GROUP BY status
ORDER BY status;

SELECT 
  'AFTER FIX - Tournament Statuses:' as info,
  status,
  COUNT(*) as count
FROM tournaments
GROUP BY status
ORDER BY status;

-- Done!
SELECT '✅ STATUS VALUES STANDARDIZED' as status;
SELECT 'Competitions now use: registration_open (not reg_open)' as info;
SELECT 'Competitions now use: registration_closed (not reg_closed)' as info;

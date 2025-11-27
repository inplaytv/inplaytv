-- ===================================================================
-- CLEAN DUMMY/TEST DATA FROM DATABASE
-- Removes all test tournaments, competitions, and related data
-- Run this to start fresh with real DataGolf data
-- ===================================================================

-- WARNING: This will delete data! Make sure you want to do this.
-- Backup your database first if needed.

-- Delete all test/dummy tournaments
DELETE FROM public.tournaments 
WHERE 
  name LIKE '%Test%' OR
  name LIKE '%Demo%' OR
  name LIKE '%Sample%' OR
  name = 'The Masters Tournament' OR
  name = 'PGA Championship' OR
  name = 'U.S. Open Championship' OR
  name = 'The Open Championship' OR
  name = 'The Players Championship' OR
  name = 'Memorial Tournament' OR
  name = 'The Chevron Championship' OR
  name = 'KPMG Women''s PGA Championship' OR
  name = 'U.S. Women''s Open' OR
  name = 'Women''s British Open' OR
  name = 'The Amundi Evian Championship' OR
  name = 'BMW PGA Championship' OR
  name = 'Horizon Irish Open' OR
  name = 'Genesis Scottish Open' OR
  name = 'DP World Tour Championship' OR
  name = 'DS Automobiles Italian Open';

-- Verify remaining tournaments
SELECT 
  id,
  name,
  start_date,
  status,
  created_at
FROM public.tournaments
ORDER BY created_at DESC;

-- Complete wipe of ALL ONE 2 ONE challenges (not just recent ones)
-- This removes everything to give you a completely fresh start

-- First, see how many total ONE 2 ONE entries exist
SELECT COUNT(*) as total_one2one_entries
FROM competition_entries
WHERE instance_id IS NOT NULL;

-- Delete ALL ONE 2 ONE entries (where instance_id is set)
DELETE FROM competition_entries
WHERE instance_id IS NOT NULL;

-- Delete ALL ONE 2 ONE instances
DELETE FROM competition_instances;

-- Verify everything is gone
SELECT 
  'Total instances remaining:' as check,
  COUNT(*) as count
FROM competition_instances
UNION ALL
SELECT 
  'Total ONE 2 ONE entries remaining:' as check,
  COUNT(*) as count
FROM competition_entries
WHERE instance_id IS NOT NULL;

-- Complete cleanup of ALL recent ONE 2 ONE challenges
-- This will give you a completely fresh start

-- Delete ALL entries from the last 3 hours (covers all the test challenges)
DELETE FROM competition_entries
WHERE instance_id IN (
  SELECT id FROM competition_instances 
  WHERE created_at > NOW() - INTERVAL '3 hours'
);

-- Delete ALL instances from the last 3 hours
DELETE FROM competition_instances
WHERE created_at > NOW() - INTERVAL '3 hours';

-- Verify everything is clean
SELECT 
  'Recent instances (should be 0):' as check,
  COUNT(*) as count
FROM competition_instances
WHERE created_at > NOW() - INTERVAL '3 hours'
UNION ALL
SELECT 
  'Recent entries (should be 0):' as check,
  COUNT(*) as count
FROM competition_entries
WHERE created_at > NOW() - INTERVAL '3 hours';

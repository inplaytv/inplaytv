-- Check if competition_instances (ONE 2 ONE challenges) still exist
SELECT 
  'competition_instances' as table_name,
  COUNT(*) as total_records
FROM competition_instances;

-- Show recent instances
SELECT 
  id,
  name,
  status,
  rounds_covered,
  created_at
FROM competition_instances
ORDER BY created_at DESC
LIMIT 10;

-- Check entries with instance_id (ONE 2 ONE entries)
SELECT 
  'entries_with_instance_id' as table_name,
  COUNT(*) as total_entries
FROM competition_entries
WHERE instance_id IS NOT NULL;

-- Show recent ONE 2 ONE entries with user info
SELECT 
  ce.id,
  ce.instance_id,
  ce.user_id,
  ce.status,
  ce.created_at,
  ci.name as instance_name,
  ci.status as instance_status
FROM competition_entries ce
JOIN competition_instances ci ON ci.id = ce.instance_id
ORDER BY ce.created_at DESC
LIMIT 10;

-- Check if we have any orphaned entries (instance_id that doesn't exist)
SELECT 
  ce.id,
  ce.instance_id,
  ce.user_id,
  ce.created_at
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
WHERE ce.instance_id IS NOT NULL
  AND ci.id IS NULL;

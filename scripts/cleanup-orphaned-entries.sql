-- Clean up the 3 orphaned entries

-- See what these entries are
SELECT 
  ce.id,
  ce.instance_id,
  ce.competition_id,
  ce.status,
  ce.created_at,
  p.username
FROM competition_entries ce
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ce.created_at > NOW() - INTERVAL '3 hours'
ORDER BY ce.created_at DESC;

-- Delete these orphaned entries
DELETE FROM competition_entries
WHERE created_at > NOW() - INTERVAL '3 hours';

-- Verify they're gone (should return 0)
SELECT COUNT(*) as remaining_entries
FROM competition_entries
WHERE created_at > NOW() - INTERVAL '3 hours';

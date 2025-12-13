-- Check what status values the entries actually have
SELECT 
  ce.id,
  ce.instance_id,
  ce.user_id,
  ce.status,
  ce.created_at
FROM competition_entries ce
WHERE ce.instance_id IN (
  SELECT id FROM competition_instances 
  WHERE created_at > NOW() - INTERVAL '1 day'
)
ORDER BY ce.created_at DESC;

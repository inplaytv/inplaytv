-- Find what's blocking Terry from accepting the current challenge
-- Instance ID: 9c8356fb-c401-457e-8220-a2cc1030271e

-- See all entries for this specific instance
SELECT 
  ce.id,
  ce.user_id,
  p.username,
  ce.status,
  ce.created_at
FROM competition_entries ce
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ce.instance_id = '9c8356fb-c401-457e-8220-a2cc1030271e'
ORDER BY ce.created_at;

-- Check Terry's ALL entries
SELECT 
  ce.id,
  ce.instance_id,
  ce.status,
  ce.created_at,
  ci.status as instance_status
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
WHERE ce.user_id = (SELECT id FROM profiles WHERE username ILIKE '%terry%' LIMIT 1)
ORDER BY ce.created_at DESC
LIMIT 10;

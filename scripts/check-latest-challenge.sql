-- Check the actual database state for the latest challenge
-- Instance ID: 94372c35-4ea7-47bf-8ba3-93e496f342ba

-- See the instance status
SELECT 
  id,
  instance_number,
  status,
  current_players,
  max_players
FROM competition_instances
WHERE id = '94372c35-4ea7-47bf-8ba3-93e496f342ba';

-- See all entries for this instance
SELECT 
  ce.id,
  p.username,
  ce.status,
  ce.created_at
FROM competition_entries ce
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ce.instance_id = '94372c35-4ea7-47bf-8ba3-93e496f342ba'
ORDER BY ce.created_at;

-- Count total entries
SELECT COUNT(*) as total_entries
FROM competition_entries
WHERE instance_id = '94372c35-4ea7-47bf-8ba3-93e496f342ba';

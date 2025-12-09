-- Update ALL instances to status='open' and current_players=1
UPDATE competition_instances
SET status = 'open', current_players = 1
WHERE max_players = 2;

-- Verify all are now open
SELECT 
  id,
  status,
  current_players,
  max_players,
  instance_number
FROM competition_instances
ORDER BY created_at DESC;

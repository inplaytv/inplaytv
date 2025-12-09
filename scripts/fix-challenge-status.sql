-- Check for database triggers on competition_instances
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'competition_instances';

-- Check current status of your 3 challenges
SELECT 
  id,
  status,
  current_players,
  max_players,
  created_at,
  updated_at
FROM competition_instances
ORDER BY created_at DESC
LIMIT 5;

-- Manually fix the status of 'full' instances that only have 1 player
UPDATE competition_instances
SET status = 'open'
WHERE status = 'full' AND current_players < max_players;

-- Verify the fix
SELECT 
  id,
  status,
  current_players,
  max_players
FROM competition_instances
WHERE current_players < max_players
ORDER BY created_at DESC;

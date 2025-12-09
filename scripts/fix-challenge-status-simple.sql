-- Fix ALL challenges marked as 'full' when they only have 1 player
UPDATE competition_instances
SET status = 'open', current_players = 1
WHERE status = 'full' 
  AND current_players <= 1
  AND max_players = 2;

-- Show how many rows were updated (should be 3)
SELECT COUNT(*) as fixed_challenges FROM competition_instances WHERE status = 'open';

-- Clean up the duplicate £5 challenge that was just created
-- This removes the instance that shouldn't have been created

-- Find the duplicate £5 instance (the newest one with status 'open' and your username appearing twice)
SELECT 
  ci.id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.created_at,
  STRING_AGG(p.username, ', ') as usernames,
  COUNT(ce.id) as entry_count
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ci.entry_fee_pennies = 500  -- £5
  AND ci.created_at > NOW() - INTERVAL '2 hours'
GROUP BY ci.id
ORDER BY ci.created_at DESC;

-- Delete entries for the problematic instance (run this after confirming the instance ID above)
-- Replace INSTANCE_ID with the ID from the query above
-- DELETE FROM competition_entries WHERE instance_id = 'INSTANCE_ID';
-- DELETE FROM competition_instances WHERE id = 'INSTANCE_ID';

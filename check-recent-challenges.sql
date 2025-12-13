-- Check recent challenge instances and their entries
SELECT 
  ci.id as instance_id,
  ci.status,
  ci.current_players,
  ci.created_at as instance_created,
  COUNT(ce.id) as entry_count,
  STRING_AGG(ce.user_id::text, ', ') as user_ids
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ci.id = ce.instance_id
WHERE ci.created_at > NOW() - INTERVAL '1 day'
GROUP BY ci.id, ci.status, ci.current_players, ci.created_at
ORDER BY ci.created_at DESC
LIMIT 20;

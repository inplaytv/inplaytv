-- Check all recent instances with their user info
SELECT 
  ci.id as instance_id,
  ci.status,
  ci.current_players,
  ci.entry_fee_pennies,
  ci.created_at,
  ce.user_id,
  p.username
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ci.id = ce.instance_id
LEFT JOIN profiles p ON ce.user_id = p.id
WHERE ci.created_at > NOW() - INTERVAL '2 hours'
ORDER BY ci.created_at DESC;

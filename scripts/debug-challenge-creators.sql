-- Check who created each challenge
SELECT 
  ci.id as instance_id,
  ci.instance_number,
  t.name as tournament_name,
  ci.created_at as instance_created,
  ce.id as entry_id,
  ce.user_id,
  p.display_name,
  p.username,
  ce.created_at as entry_created
FROM competition_instances ci
JOIN tournaments t ON t.id = ci.tournament_id
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ci.status = 'open'
  AND ci.current_players < 2
ORDER BY ci.created_at DESC, ce.created_at ASC;

-- Show Terry Tibbs' user ID for reference
SELECT id, username, display_name 
FROM profiles 
WHERE username = 'terrytibbs' OR display_name LIKE '%Terry%';

-- Check the status of ONE 2 ONE challenges
SELECT 
  ci.id,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.created_at,
  t.name as tournament_name,
  ct.name as template_name,
  COUNT(ce.id) as entry_count
FROM competition_instances ci
LEFT JOIN tournaments t ON ci.tournament_id = t.id
LEFT JOIN competition_templates ct ON ci.template_id = ct.id
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
GROUP BY ci.id, ci.status, ci.current_players, ci.max_players, ci.created_at, t.name, ct.name
ORDER BY ci.created_at DESC
LIMIT 10;

-- Check what entries exist for these instances
SELECT 
  ce.id as entry_id,
  ce.instance_id,
  ce.competition_id,
  ce.user_id,
  ce.created_at,
  ci.status as instance_status,
  ci.current_players,
  ci.max_players
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ce.instance_id = ci.id
WHERE ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC
LIMIT 10;

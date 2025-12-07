-- Show ALL ONE 2 ONE entries and their instance status
SELECT 
  ce.id as entry_id,
  ce.entry_name,
  ce.user_id,
  ci.id as instance_id,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.instance_number,
  t.name as tournament_name,
  ct.name as template_name,
  ce.created_at
FROM competition_entries ce
JOIN competition_instances ci ON ci.id = ce.instance_id
JOIN tournaments t ON t.id = ci.tournament_id
JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Summary by status
SELECT 
  ci.status,
  COUNT(*) as entry_count,
  COUNT(DISTINCT ci.id) as instance_count
FROM competition_entries ce
JOIN competition_instances ci ON ci.id = ce.instance_id
WHERE ce.instance_id IS NOT NULL
GROUP BY ci.status;

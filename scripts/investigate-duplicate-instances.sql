-- See all instances with their details
SELECT 
  ci.id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.created_at,
  ci.template_id,
  ct.name as template_name,
  ci.tournament_id,
  t.name as tournament_name,
  t.slug as tournament_slug
FROM competition_instances ci
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
LEFT JOIN tournaments t ON t.id = ci.tournament_id
ORDER BY ci.created_at DESC;

-- See which entries point to which instances
SELECT 
  ce.id as entry_id,
  ce.instance_id,
  ci.instance_number,
  ci.status as instance_status,
  ct.name as template_name,
  t.name as tournament_name,
  ce.created_at as entry_created_at,
  ci.created_at as instance_created_at
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
LEFT JOIN tournaments t ON t.id = ci.tournament_id
WHERE ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Check if there are database triggers that might create duplicate instances
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'competition_instances';

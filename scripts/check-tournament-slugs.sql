-- Check what tournament slugs exist and their status
SELECT 
  id,
  name,
  slug,
  status,
  start_date,
  end_date,
  current_round
FROM tournaments
ORDER BY start_date DESC;

-- Check which tournament the instances are linked to
SELECT 
  ci.id as instance_id,
  t.name as tournament_name,
  t.slug as tournament_slug,
  t.status as tournament_status,
  ct.name as template_name
FROM competition_instances ci
LEFT JOIN tournaments t ON t.id = ci.tournament_id
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
ORDER BY ci.created_at DESC;

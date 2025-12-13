-- Check competition_instances for ONE 2 ONE challenges
-- Run in Supabase SQL Editor

-- Check all instances and their tournament_ids
SELECT 
  ci.id as instance_id,
  ci.template_id,
  ci.tournament_id,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.created_at,
  t.name as tournament_name,
  t.slug as tournament_slug,
  ct.name as template_name
FROM competition_instances ci
LEFT JOIN tournaments t ON ci.tournament_id = t.id
LEFT JOIN competition_templates ct ON ci.template_id = ct.id
ORDER BY ci.created_at DESC
LIMIT 20;

-- Check if there are any instances with NULL tournament_id
SELECT 
  COUNT(*) as total_instances,
  COUNT(tournament_id) as instances_with_tournament,
  COUNT(*) - COUNT(tournament_id) as instances_missing_tournament
FROM competition_instances;

-- Check ALL competition instances (challenges) - no user filter needed
SELECT 
  ci.id as instance_id,
  ci.template_id,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.entry_fee_pennies,
  ci.created_at,
  ct.name as template_name,
  ct.admin_fee_percent
FROM competition_instances ci
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
ORDER BY ci.created_at DESC
LIMIT 10;

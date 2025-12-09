-- Check what's in competition_instances right now
SELECT 
  ci.id,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.created_at,
  ct.name as template_name
FROM competition_instances ci
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
ORDER BY ci.created_at DESC;

-- Check what's in competition_entries
SELECT 
  ce.id,
  ce.user_id,
  ce.instance_id,
  ce.competition_id,
  ce.entry_fee_paid,
  ce.created_at
FROM competition_entries ce
ORDER BY ce.created_at DESC;

-- See if entries have instances that match
SELECT 
  ce.id as entry_id,
  ce.instance_id,
  ci.status as instance_status,
  ci.current_players,
  ct.name as challenge_name
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC;

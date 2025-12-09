-- Check for orphaned instances (instances with no entries)
SELECT 
  ci.id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.entry_fee_pennies,
  ct.name as template_name,
  t.name as tournament_name,
  t.slug as tournament_slug,
  ci.created_at,
  COUNT(ce.id) as entry_count
FROM competition_instances ci
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
LEFT JOIN tournaments t ON t.id = ci.tournament_id
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
GROUP BY ci.id, ci.instance_number, ci.status, ci.current_players, ci.entry_fee_pennies, ct.name, t.name, t.slug, ci.created_at
ORDER BY ci.created_at DESC;

-- Show all entries with their instance details
SELECT 
  ce.id,
  ce.user_id,
  ce.instance_id,
  ce.entry_name,
  ce.entry_fee_paid,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.entry_fee_pennies as instance_entry_fee,
  ct.name as template_name,
  t.name as tournament_name,
  ce.created_at
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
LEFT JOIN tournaments t ON t.id = ci.tournament_id
WHERE ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Count how many instances vs how many entries
SELECT 
  'Instances' as type,
  COUNT(*) as count
FROM competition_instances
UNION ALL
SELECT 
  'Entries' as type,
  COUNT(*) as count
FROM competition_entries
WHERE instance_id IS NOT NULL;

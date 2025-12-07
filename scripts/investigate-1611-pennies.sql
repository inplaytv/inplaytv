/* ===================================================================
   DETAILED INVESTIGATION: Challenge #A55CA50A
   =================================================================== */

-- Find ALL details about this specific challenge
SELECT 
  ci.id,
  SUBSTRING(ci.id::text, 1, 8) as short_id,
  ci.entry_fee_pennies as instance_entry_fee_pennies,
  ct.entry_fee_pennies as template_entry_fee_pennies,
  ci.entry_fee_pennies / 100.0 as instance_entry_fee_pounds,
  ct.entry_fee_pennies / 100.0 as template_entry_fee_pounds,
  ct.admin_fee_percent,
  -- Prize pool calculation
  (ci.entry_fee_pennies * 2 * (100 - ct.admin_fee_percent)) / 10000.0 as calculated_prize_pounds,
  ct.name as template_name,
  ct.short_name,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.created_at,
  ci.updated_at,
  t.name as tournament_name
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
JOIN tournaments t ON ci.tournament_id = t.id
WHERE ci.id::text LIKE 'a55ca50a%'
ORDER BY ci.created_at DESC;

-- Check if there are ANY entries with this exact fee
SELECT 
  ci.entry_fee_pennies,
  ci.entry_fee_pennies / 100.0 as entry_fee_pounds,
  COUNT(*) as count_with_this_fee,
  MIN(ci.created_at) as first_created,
  MAX(ci.created_at) as last_created
FROM competition_instances ci
WHERE ci.entry_fee_pennies = 1611
GROUP BY ci.entry_fee_pennies;

-- Check what entry fees exist in the system
SELECT 
  ci.entry_fee_pennies,
  ci.entry_fee_pennies / 100.0 as entry_fee_pounds,
  COUNT(*) as count,
  ct.short_name as template_name
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
GROUP BY ci.entry_fee_pennies, ct.short_name
ORDER BY ci.entry_fee_pennies;

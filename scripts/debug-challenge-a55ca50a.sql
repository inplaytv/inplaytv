/* ===================================================================
   DEBUG SPECIFIC CHALLENGE - TRACE £30.60 CALCULATION
   =================================================================== */

-- Find the challenge with ID starting with A55CA50A
SELECT 
  ci.id,
  SUBSTRING(ci.id::text, 1, 8) as short_id,
  ci.entry_fee_pennies,
  ci.entry_fee_pennies / 100.0 as entry_fee_pounds,
  ct.admin_fee_percent,
  -- Calculate what the prize SHOULD be
  (ci.entry_fee_pennies * 2 * (100 - ct.admin_fee_percent)) / 10000.0 as calculated_prize_pounds,
  ct.name as template_name,
  ct.short_name,
  ci.status,
  ci.current_players,
  ci.created_at
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
WHERE ci.id::text LIKE 'a55ca50a%'
ORDER BY ci.created_at DESC;

-- If no results, search all recent challenges
SELECT 
  ci.id,
  SUBSTRING(ci.id::text, 1, 8) as short_id,
  ci.entry_fee_pennies,
  ci.entry_fee_pennies / 100.0 as entry_fee_pounds,
  ct.admin_fee_percent,
  (ci.entry_fee_pennies * 2 * (100 - ct.admin_fee_percent)) / 10000.0 as calculated_prize_pounds,
  ct.short_name,
  ci.status,
  ci.current_players,
  ci.created_at
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
WHERE ci.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ci.created_at DESC
LIMIT 20;

/* ===================================================================
   REVERSE CALCULATION: What entry fee gives £30.60 prize?
   =================================================================== */

-- With 10% admin fee:
-- Prize = Entry × 2 × 90%
-- £30.60 = Entry × 1.8
-- Entry = £30.60 / 1.8 = £17.00

SELECT 
  'If prize pool is £30.60' as scenario,
  '10% admin fee' as admin_fee,
  30.60 / 1.8 as entry_fee_pounds,
  (30.60 / 1.8 * 100)::integer as entry_fee_pennies;

-- With 5% admin fee:
SELECT 
  'If prize pool is £30.60' as scenario,
  '5% admin fee' as admin_fee,
  30.60 / 1.9 as entry_fee_pounds,
  (30.60 / 1.9 * 100)::integer as entry_fee_pennies;

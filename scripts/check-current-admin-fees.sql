-- Check current admin fees for all ONE 2 ONE templates
SELECT 
  CASE 
    WHEN array_length(rounds_covered, 1) = 4 THEN 'All 4 Rounds'
    WHEN rounds_covered[1] = 1 THEN 'Round 1 Only'
    WHEN rounds_covered[1] = 2 THEN 'Round 2 Only'
    WHEN rounds_covered[1] = 3 THEN 'Round 3 Only'
    WHEN rounds_covered[1] = 4 THEN 'Round 4 Only'
  END as template_name,
  admin_fee_percent as current_admin_fee,
  entry_fee_pennies / 100.0 as default_entry_pounds,
  (entry_fee_pennies * 2 * (100 - admin_fee_percent)) / 10000.0 as winner_gets_pounds,
  (entry_fee_pennies * 2 * admin_fee_percent) / 10000.0 as platform_cut_pounds
FROM competition_templates
WHERE rounds_covered IS NOT NULL
ORDER BY 
  array_length(rounds_covered, 1) DESC,
  rounds_covered[1];

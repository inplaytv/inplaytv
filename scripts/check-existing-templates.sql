-- Check what ONE 2 ONE templates exist
SELECT 
  CASE 
    WHEN array_length(rounds_covered, 1) = 4 THEN 'All 4 Rounds'
    WHEN rounds_covered[1] = 1 THEN 'Round 1 Only'
    WHEN rounds_covered[1] = 2 THEN 'Round 2 Only'
    WHEN rounds_covered[1] = 3 THEN 'Round 3 Only'
    WHEN rounds_covered[1] = 4 THEN 'Round 4 Only'
    ELSE 'Unknown'
  END as template_name,
  rounds_covered,
  entry_fee_pennies / 100.0 as default_entry_fee_pounds,
  admin_fee_percent,
  max_players,
  status
FROM competition_templates
WHERE rounds_covered IS NOT NULL
ORDER BY 
  array_length(rounds_covered, 1) DESC,
  rounds_covered[1];

-- Check what templates exist and their status
SELECT 
  id,
  CASE 
    WHEN array_length(rounds_covered, 1) = 4 THEN 'All 4 Rounds'
    WHEN rounds_covered[1] = 1 THEN 'Round 1 Only'
    WHEN rounds_covered[1] = 2 THEN 'Round 2 Only'
    WHEN rounds_covered[1] = 3 THEN 'Round 3 Only'
    WHEN rounds_covered[1] = 4 THEN 'Round 4 Only'
  END as template_name,
  rounds_covered,
  admin_fee_percent,
  status,
  created_at
FROM competition_templates
WHERE rounds_covered IS NOT NULL
ORDER BY rounds_covered;

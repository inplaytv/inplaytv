-- STEP 1: Calculate refunds for all users with entries
-- Run this first to see who needs refunds and how much

SELECT 
  ce.user_id,
  p.username,
  p.display_name,
  COUNT(ce.id) as total_entries,
  SUM(tc.entry_fee_pennies) as total_paid_pennies,
  SUM(tc.entry_fee_pennies) / 100.0 as total_paid_pounds
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ce.status != 'cancelled'
GROUP BY ce.user_id, p.username, p.display_name
ORDER BY total_paid_pennies DESC;

-- STEP 2: Show total refund amount needed
SELECT 
  COUNT(DISTINCT ce.user_id) as users_to_refund,
  COUNT(ce.id) as total_entries,
  SUM(tc.entry_fee_pennies) as total_refund_pennies,
  SUM(tc.entry_fee_pennies) / 100.0 as total_refund_pounds
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
WHERE ce.status != 'cancelled';

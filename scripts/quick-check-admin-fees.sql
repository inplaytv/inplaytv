-- Quick check of current admin fees
SELECT 
  name,
  admin_fee_percent,
  entry_fee_pennies / 100.0 as entry_fee,
  status
FROM competition_templates
ORDER BY created_at;

-- Show all competition types with their template settings
SELECT 
  id,
  name,
  slug,
  status,
  is_template,
  default_entry_fee_pennies,
  default_entrants_cap,
  default_admin_fee_percent,
  default_reg_open_days_before,
  rounds_applicable,
  created_at
FROM competition_types
ORDER BY created_at;

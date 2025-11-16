-- ===================================================================
-- CHECK LATEST ENTRIES AND TRANSACTIONS
-- See what actually got saved in the database
-- ===================================================================

-- Check recent entries for your user
SELECT 
  ce.id,
  ce.entry_name,
  ce.status,
  ce.entry_fee_paid,
  ce.total_salary,
  ce.created_at,
  ce.submitted_at,
  tc.entry_fee_pennies as competition_fee,
  t.name as tournament_name
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
JOIN tournaments t ON t.id = tc.tournament_id
WHERE ce.user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
ORDER BY ce.created_at DESC
LIMIT 5;

-- Check recent wallet transactions
SELECT 
  id,
  amount_pennies,
  transaction_type,
  status,
  description,
  created_at
FROM wallet_transactions
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
ORDER BY created_at DESC
LIMIT 10;

-- Check current wallet balance
SELECT 
  user_id,
  balance_cents,
  created_at,
  updated_at
FROM wallets
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

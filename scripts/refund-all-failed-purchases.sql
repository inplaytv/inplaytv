-- ===================================================================
-- REFUND ALL FAILED PURCHASES
-- Check how much was taken without creating entries
-- ===================================================================

-- First, see how many failed transactions we have
SELECT 
  COUNT(*) as failed_purchase_count,
  SUM(ABS(change_cents)) as total_taken_cents,
  SUM(ABS(change_cents)) / 100.0 as total_taken_pounds
FROM wallet_transactions
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
  AND change_cents < 0
  AND reason LIKE '%Entry fee%';

-- Check how many actual entries exist
SELECT COUNT(*) as actual_entries_created
FROM competition_entries
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

-- See current balance
SELECT 
  balance_cents as current_balance_pennies,
  balance_cents / 100.0 as current_balance_pounds
FROM wallets
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

-- Calculate what balance SHOULD be (assuming you started with £109 and no entries were created)
-- If you had £109 originally, you should still have £109 if no scorecards were actually saved

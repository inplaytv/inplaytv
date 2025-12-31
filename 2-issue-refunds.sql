-- STEP 2: Issue refunds to all users
-- This uses the wallet_apply RPC function to add funds back

BEGIN;

-- Create temporary table with refund amounts
CREATE TEMP TABLE refund_amounts AS
SELECT 
  ce.user_id,
  SUM(tc.entry_fee_pennies) as refund_pennies,
  COUNT(ce.id) as entry_count
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
WHERE ce.status != 'cancelled'
GROUP BY ce.user_id;

-- Issue refunds using wallet_apply function
DO $$
DECLARE
  refund_record RECORD;
  new_balance INTEGER;
BEGIN
  FOR refund_record IN SELECT * FROM refund_amounts LOOP
    -- Apply refund to wallet
    SELECT wallet_apply(
      refund_record.refund_pennies,
      'refund:database-reset - ' || refund_record.entry_count || ' entries',
      refund_record.user_id
    ) INTO new_balance;
    
    RAISE NOTICE 'Refunded user % - Amount: £% - New balance: £%', 
      refund_record.user_id, 
      refund_record.refund_pennies / 100.0,
      new_balance / 100.0;
  END LOOP;
END $$;

-- Show refund summary
SELECT 
  COUNT(*) as users_refunded,
  SUM(refund_pennies) as total_refunded_pennies,
  SUM(refund_pennies) / 100.0 as total_refunded_pounds
FROM refund_amounts;

-- Show wallet transactions for verification
SELECT 
  wt.user_id,
  p.username,
  wt.change_cents,
  wt.reason,
  wt.balance_after_cents / 100.0 as new_balance_pounds,
  wt.created_at
FROM wallet_transactions wt
JOIN profiles p ON p.id = wt.user_id
WHERE wt.reason LIKE 'refund:database-reset%'
ORDER BY wt.created_at DESC;

COMMIT;

-- Verification: Check all users have been refunded
SELECT 
  'Users with entries but no refund' as status,
  COUNT(DISTINCT ce.user_id) as count
FROM competition_entries ce
LEFT JOIN wallet_transactions wt ON wt.user_id = ce.user_id 
  AND wt.reason LIKE 'refund:database-reset%'
WHERE wt.id IS NULL;

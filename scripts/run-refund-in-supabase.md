# Run This Refund in Supabase SQL Editor

Go to your Supabase project → SQL Editor → New Query, then paste and run:

```sql
-- ===================================================================
-- REFUND FAILED PURCHASE
-- Add £60 back to the wallet since no entry was created
-- User: 722a6137-e43a-4184-b31e-eb0fea2f6dff
-- ===================================================================

-- Add 6000 pennies (£60) back to the wallet
UPDATE wallets 
SET balance_cents = balance_cents + 6000
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

-- Create a refund transaction record
INSERT INTO wallet_transactions (
  user_id,
  change_cents,
  reason,
  balance_after_cents
) VALUES (
  '722a6137-e43a-4184-b31e-eb0fea2f6dff',
  6000,
  'REFUND: Failed purchase - entry not created',
  (SELECT balance_cents FROM wallets WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff')
);

-- Verify new balance
SELECT 
  balance_cents,
  balance_cents / 100.0 as balance_pounds
FROM wallets
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';
```

Expected result: Balance should show **10900** pennies (£109.00)

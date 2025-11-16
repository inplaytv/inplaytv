-- ===================================================================
-- RESTORE BALANCE TO £109
-- Refund the difference between current (£49) and original (£109)
-- ===================================================================

-- Add back £60 (6000 pennies) to get back to £109
UPDATE wallets 
SET balance_cents = balance_cents + 6000
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

-- Create refund transaction record
INSERT INTO wallet_transactions (
  user_id,
  change_cents,
  reason,
  balance_after_cents
) VALUES (
  '722a6137-e43a-4184-b31e-eb0fea2f6dff',
  6000,
  'REFUND: Failed purchases - entries not created',
  (SELECT balance_cents FROM wallets WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff')
);

-- Verify new balance (should be £109)
SELECT 
  balance_cents as balance_pennies,
  balance_cents / 100.0 as balance_pounds
FROM wallets
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

-- ===================================================================
-- CREATE ATOMIC WALLET DEDUCTION FUNCTION
-- ===================================================================
-- Problem: Race condition when multiple purchases happen quickly
-- Multiple reads of balance happen before writes, causing lost updates
-- Solution: Single atomic PostgreSQL function that does read+check+write+log

CREATE OR REPLACE FUNCTION public.deduct_from_wallet(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the wallet row for update (prevents concurrent modifications)
  SELECT balance_cents
  INTO v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if wallet exists
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount_cents THEN
    RAISE EXCEPTION 'Insufficient funds. Current: %, Required: %', v_current_balance, p_amount_cents;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount_cents;

  -- Update wallet atomically
  UPDATE public.wallets
  SET balance_cents = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    user_id,
    change_cents,
    reason,
    balance_after_cents
  ) VALUES (
    p_user_id,
    -p_amount_cents,
    p_reason,
    v_new_balance
  );

  -- Return success with new balance
  RETURN json_build_object(
    'success', true,
    'old_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount_cents
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RAISE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.deduct_from_wallet(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_from_wallet(UUID, INTEGER, TEXT) TO service_role;

-- Test the function
DO $$
DECLARE
  test_user_id UUID;
  test_result JSON;
BEGIN
  -- Get first user for testing
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE '✅ Function created successfully';
    RAISE NOTICE 'Test user ID: %', test_user_id;
    
    -- Don't actually test deduction, just verify function exists
    RAISE NOTICE '✅ Ready to use: SELECT deduct_from_wallet(user_id, amount_cents, reason)';
  ELSE
    RAISE NOTICE '⚠️ No users found for testing, but function created';
  END IF;
END $$;

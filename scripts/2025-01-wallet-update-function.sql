-- Update wallet_apply function to support service role calls
-- This allows the function to be called with an explicit user_id parameter
-- when invoked via service role key (for payment processing)

DROP FUNCTION IF EXISTS public.wallet_apply(bigint, text);

CREATE OR REPLACE FUNCTION public.wallet_apply(
  change_cents bigint,
  reason text,
  target_user_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_old_balance bigint;
  v_new_balance bigint;
BEGIN
  -- Use provided user_id if given (service role), otherwise auth.uid() (user call)
  v_user_id := COALESCE(target_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the wallet row for update (or insert if missing)
  INSERT INTO public.wallets (user_id, balance_cents, updated_at)
  VALUES (v_user_id, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current balance with row lock
  SELECT balance_cents INTO v_old_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Calculate new balance
  v_new_balance := v_old_balance + change_cents;

  -- Validate sufficient funds for debits
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient funds: balance=% change=%', v_old_balance, change_cents;
  END IF;

  -- Update wallet balance
  UPDATE public.wallets
  SET balance_cents = v_new_balance,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Log transaction (immutable audit trail)
  INSERT INTO public.wallet_transactions (user_id, change_cents, reason, balance_after_cents, created_at)
  VALUES (v_user_id, change_cents, reason, v_new_balance, now());

  -- Return new balance
  RETURN v_new_balance;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.wallet_apply(bigint, text, uuid) TO anon, authenticated;

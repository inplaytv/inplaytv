-- Migration: Wallet system with transactions
-- Created: 2025-01-18
-- Purpose: Secure wallet with balance and transaction history
-- CRITICAL: All balance changes MUST go through wallet_apply() function

-- Create wallets table (stores current balance only)
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents bigint NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create wallet_transactions table (immutable audit log)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_cents bigint NOT NULL,
  reason text NOT NULL,
  balance_after_cents bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;

-- Wallets policies: SELECT only (no direct INSERT/UPDATE allowed)
CREATE POLICY "Users can view own wallet"
  ON public.wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Transactions policies: SELECT only (no direct INSERT allowed)
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant SELECT only (mutations via function)
GRANT SELECT ON public.wallets TO anon, authenticated;
GRANT SELECT ON public.wallet_transactions TO anon, authenticated;

-- Create secure wallet_apply function
-- This is the ONLY way to modify wallet balances
DROP FUNCTION IF EXISTS public.wallet_apply(bigint, text);

CREATE OR REPLACE FUNCTION public.wallet_apply(
  change_cents bigint,
  reason text
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
  -- Get authenticated user
  v_user_id := auth.uid();
  
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
GRANT EXECUTE ON FUNCTION public.wallet_apply(bigint, text) TO anon, authenticated;

-- Create index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created 
  ON public.wallet_transactions(user_id, created_at DESC);

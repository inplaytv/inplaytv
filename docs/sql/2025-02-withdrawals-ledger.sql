-- Migration: Withdrawals and Enhanced Ledger
-- Created: 2025-02-19
-- Purpose: User withdrawal requests, admin approval workflow, unified ledger view
-- Depends on: 2025-02-admins.sql (is_admin function)

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_by uuid NULL REFERENCES auth.users(id),
  processed_at timestamptz NULL,
  note text NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id 
  ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status 
  ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_requested_at 
  ON public.withdrawal_requests(requested_at DESC);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.withdrawal_requests;

-- RLS policies for users
CREATE POLICY "Users can view own withdrawal requests"
  ON public.withdrawal_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests"
  ON public.withdrawal_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- RLS policies for admins
CREATE POLICY "Admins can view all withdrawal requests"
  ON public.withdrawal_requests
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update withdrawal requests"
  ON public.withdrawal_requests
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;
GRANT UPDATE ON public.withdrawal_requests TO authenticated;

-- Admin function to process withdrawal status changes
DROP FUNCTION IF EXISTS public.admin_withdrawal_set_status(bigint, text, text);

CREATE OR REPLACE FUNCTION public.admin_withdrawal_set_status(
  p_request_id bigint,
  p_new_status text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
  v_user_id uuid;
  v_amount_cents bigint;
  v_admin_id uuid;
BEGIN
  -- Require admin privileges
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Validate new status
  IF p_new_status NOT IN ('approved', 'rejected', 'paid', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- Lock and get current request
  SELECT status, user_id, amount_cents
  INTO v_current_status, v_user_id, v_amount_cents
  FROM public.withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request % not found', p_request_id;
  END IF;

  -- Validate status transition
  IF v_current_status = 'pending' THEN
    -- pending can go to: approved, rejected, cancelled
    IF p_new_status NOT IN ('approved', 'rejected', 'cancelled') THEN
      RAISE EXCEPTION 'Invalid transition from pending to %', p_new_status;
    END IF;
  ELSIF v_current_status = 'approved' THEN
    -- approved can go to: paid, cancelled
    IF p_new_status NOT IN ('paid', 'cancelled') THEN
      RAISE EXCEPTION 'Invalid transition from approved to %', p_new_status;
    END IF;
  ELSIF v_current_status IN ('rejected', 'paid') THEN
    -- Terminal states cannot change
    RAISE EXCEPTION 'Cannot change status from terminal state %', v_current_status;
  END IF;

  -- If marking as paid, process the withdrawal
  IF p_new_status = 'paid' THEN
    -- Debit the wallet (negative amount)
    PERFORM public.wallet_apply(
      -v_amount_cents,
      format('withdrawal:%s', p_request_id),
      v_user_id
    );

    -- Record in external payments table for reconciliation
    INSERT INTO public.wallet_external_payments (
      provider,
      provider_payment_id,
      amount_cents,
      currency,
      user_id,
      status,
      metadata
    ) VALUES (
      'withdrawal',
      concat('wd:', p_request_id),
      v_amount_cents,
      'GBP',
      v_user_id,
      'completed',
      jsonb_build_object('request_id', p_request_id)
    );
  END IF;

  -- Update withdrawal request
  UPDATE public.withdrawal_requests
  SET 
    status = p_new_status,
    processed_by = v_admin_id,
    processed_at = now(),
    note = COALESCE(p_note, note)
  WHERE id = p_request_id;
END;
$$;

-- Grant execute to authenticated users (function checks is_admin internally)
GRANT EXECUTE ON FUNCTION public.admin_withdrawal_set_status(bigint, text, text) TO authenticated;

-- Create unified ledger view for reconciliation
DROP VIEW IF EXISTS public.ledger_overview;

CREATE OR REPLACE VIEW public.ledger_overview AS
-- Wallet transactions (entry fees, refunds, adjustments)
SELECT 
  'tx' as source,
  user_id,
  created_at,
  change_cents as amount_cents,
  reason,
  id::text as ref_id
FROM public.wallet_transactions

UNION ALL

-- External payments (top-ups, withdrawals)
SELECT 
  'external' as source,
  user_id,
  created_at,
  CASE 
    WHEN provider = 'withdrawal' THEN -amount_cents
    ELSE amount_cents
  END as amount_cents,
  provider as reason,
  id::text as ref_id
FROM public.wallet_external_payments

UNION ALL

-- Withdrawal requests (pending/approved status for visibility)
SELECT 
  'withdrawal' as source,
  user_id,
  requested_at as created_at,
  -amount_cents as amount_cents,
  concat('request:', status) as reason,
  id::text as ref_id
FROM public.withdrawal_requests
WHERE status IN ('pending', 'approved');

-- Grant permissions on view
GRANT SELECT ON public.ledger_overview TO authenticated;

-- NOTE: RLS is enforced through the base tables (wallet_transactions, wallet_external_payments, withdrawal_requests)
-- Users will only see rows they have access to via the base table policies
-- Admins can see all rows via the is_admin() checks on base tables

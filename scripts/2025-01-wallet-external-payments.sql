-- Create wallet_external_payments table for tracking Stripe and demo payments
-- This table ensures idempotency and prevents duplicate credits

CREATE TABLE IF NOT EXISTS public.wallet_external_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'demo')),
  provider_payment_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'GBP',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_wallet_external_payments_user_id 
  ON public.wallet_external_payments(user_id);

-- Create index on provider_payment_id for idempotency checks
CREATE INDEX IF NOT EXISTS idx_wallet_external_payments_provider_payment_id 
  ON public.wallet_external_payments(provider_payment_id);

-- Create index on created_at for history queries
CREATE INDEX IF NOT EXISTS idx_wallet_external_payments_created_at 
  ON public.wallet_external_payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.wallet_external_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own payment records
CREATE POLICY "Users can view their own payment records"
  ON public.wallet_external_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only service role can insert payment records (via API)
-- This prevents users from manually inserting fake payments
CREATE POLICY "Service role can insert payment records"
  ON public.wallet_external_payments
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_external_payments_updated_at
  BEFORE UPDATE ON public.wallet_external_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.wallet_external_payments IS 
  'Tracks external payment transactions (Stripe, demo) for wallet top-ups. Ensures idempotency via unique provider_payment_id.';

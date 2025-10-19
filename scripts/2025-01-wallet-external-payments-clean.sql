-- Create payment tracking table (safe to re-run)
CREATE TABLE IF NOT EXISTS public.wallet_external_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_wallet_ext_payments_user_id 
  ON public.wallet_external_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ext_payments_provider_id 
  ON public.wallet_external_payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ext_payments_created 
  ON public.wallet_external_payments(created_at DESC);

-- Enable RLS
ALTER TABLE public.wallet_external_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payment records" ON public.wallet_external_payments;

-- Recreate policy
CREATE POLICY "Users can view own payment records"
  ON public.wallet_external_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.wallet_external_payments TO authenticated;

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS wallet_ext_payments_updated_at ON public.wallet_external_payments;

CREATE TRIGGER wallet_ext_payments_updated_at
  BEFORE UPDATE ON public.wallet_external_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

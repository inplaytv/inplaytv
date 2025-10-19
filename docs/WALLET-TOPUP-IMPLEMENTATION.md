# Wallet Top-Up System - Implementation Report

## Overview
Implemented Stripe Checkout integration with demo mode fallback for InPlay Golf wallet top-ups.

## Environment Variables

### Required for Production (Stripe Mode)
```bash
# Server-side only (NEVER expose to client)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Client-side (public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SITE_URL=https://golf.inplay.tv
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

# Optional override (set to 'false' to force demo mode)
NEXT_PUBLIC_STRIPE_ENABLED=true
```

### Development/Demo Mode
If any of the following are missing or `NEXT_PUBLIC_STRIPE_ENABLED=false`, system runs in demo mode:
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Files Changed

### 1. apps/golf/src/app/wallet/page.tsx
- ✅ Added quick amount buttons (£5, £10, £20, £50)
- ✅ Added custom amount input (integer pounds, min £1, max £10,000)
- ✅ Client-side validation (no decimals, positive values)
- ✅ "Top Up" button calls create-checkout-session API
- ✅ Demo modal UI when Stripe not configured
- ✅ Success/error messaging with query param handling
- ✅ Demo badge display

### 2. apps/golf/src/app/api/stripe/create-checkout-session/route.ts (NEW)
- ✅ Checks for Stripe configuration (keys present, enabled flag)
- ✅ Returns 403 with `{mode: 'demo'}` when Stripe not configured
- ✅ Creates real Stripe Checkout session when configured
- ✅ Validates amount (£1 - £10,000)
- ✅ Sets user metadata for webhook processing
- ✅ Returns sessionUrl for redirect

### 3. apps/golf/src/app/api/stripe/demo-simulate/route.ts (NEW)
- ✅ Authenticates user via Supabase
- ✅ Validates amount server-side
- ✅ Generates unique provider_payment_id: `demo:${userId}:${timestamp}:${random}`
- ✅ Inserts into wallet_external_payments with provider='demo'
- ✅ Calls wallet_apply() RPC via service role key
- ✅ Idempotent (handles unique constraint violations)
- ✅ Returns new balance

### 4. apps/golf/src/app/api/stripe/webhook/route.ts (NEW)
- ✅ Verifies Stripe webhook signature
- ✅ Handles checkout.session.completed events
- ✅ Extracts userId, amountCents, paymentIntentId from session
- ✅ Inserts into wallet_external_payments with provider='stripe'
- ✅ Calls wallet_apply() RPC
- ✅ Idempotent (handles replay attacks)
- ✅ Returns 400 if Stripe not configured

### 5. apps/golf/package.json
- ✅ Added `stripe` dependency (v17.3.1)

## Database Assumptions (Pre-existing)

### Table: wallet_external_payments
```sql
CREATE TABLE wallet_external_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RPC Function: wallet_apply()
```sql
CREATE OR REPLACE FUNCTION wallet_apply(
  change_cents INTEGER,
  reason TEXT
) RETURNS INTEGER AS $$
-- Implementation maintains ledger and updates balance
-- Returns new balance_cents
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Vercel Configuration

### Environment Variables to Set
1. Go to Vercel Project Settings → Environment Variables
2. Add the following (Production environment):

```bash
# SERVER-ONLY (do NOT expose to client)
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# PUBLIC (safe for client)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
NEXT_PUBLIC_SITE_URL=https://golf.inplay.tv
```

### Stripe Webhook Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://golf.inplay.tv/api/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Security Guardrails

✅ **No secrets in client code** - All Stripe operations use server-side keys
✅ **Signature verification** - Webhook validates Stripe signature
✅ **Idempotency** - Duplicate payments prevented via unique constraints
✅ **Amount validation** - Client and server validate £1-£10,000 range
✅ **Authentication** - All endpoints verify Supabase user session
✅ **Service role isolation** - SUPABASE_SERVICE_ROLE_KEY only used server-side

## QA Checklist

### Client-Side UI
- [ ] Quick buttons (£5, £10, £20, £50) set amount input correctly
- [ ] Custom amount input accepts only integers (no decimals)
- [ ] Custom amount input rejects negative values
- [ ] Custom amount input enforces min £1, max £10,000
- [ ] "Top Up" button disabled when amount empty
- [ ] "Top Up" button shows loading state during processing

### Demo Mode (No Stripe Keys)
- [ ] Demo modal appears when Stripe not configured
- [ ] Demo modal shows "DEMO MODE" badge
- [ ] Demo modal displays correct amount and user email
- [ ] "Confirm demo payment" credits wallet via demo-simulate endpoint
- [ ] Success redirect to /wallet?status=success-demo
- [ ] Success toast shows "Demo top-up credited: £X.XX"
- [ ] wallet_external_payments table records provider='demo'
- [ ] Idempotency: replaying demo payment returns success without duplicate credit

### Stripe Mode (Keys Configured)
- [ ] "Top Up" button redirects to real Stripe Checkout
- [ ] Checkout displays correct amount in GBP
- [ ] Checkout pre-fills user email
- [ ] Successful payment triggers webhook
- [ ] Webhook credits wallet via wallet_apply()
- [ ] Success redirect to /wallet?status=success
- [ ] Success toast shows "Top-up successful! Your wallet has been credited."
- [ ] wallet_external_payments table records provider='stripe'
- [ ] Idempotency: replaying webhook returns 200 without duplicate credit

### Security
- [ ] No STRIPE_SECRET_KEY in client-side code
- [ ] No SUPABASE_SERVICE_ROLE_KEY in client-side code
- [ ] Webhook signature verification works
- [ ] Invalid webhook signatures rejected with 400
- [ ] Unauthenticated requests to APIs return 401

### Data Integrity
- [ ] Amount conversion: £10.00 → 1000 pence (accurate)
- [ ] wallet_apply() called with correct amount_cents
- [ ] Transaction history shows correct amounts
- [ ] Balance updates reflect top-up accurately

## Testing Flow

### Demo Mode Test
1. Remove/unset Stripe env vars in Vercel
2. Deploy and visit /wallet
3. Enter custom amount (e.g., £25)
4. Click "Top Up Wallet"
5. Demo modal should appear with "DEMO MODE" badge
6. Click "Confirm demo payment"
7. Should redirect to /wallet?status=success-demo
8. Balance should increase by £25.00
9. Transaction history shows "topup:demo"

### Stripe Mode Test
1. Add Stripe test keys to Vercel env vars
2. Deploy and visit /wallet
3. Click quick button (e.g., £10)
4. Click "Top Up Wallet"
5. Should redirect to Stripe Checkout
6. Complete test payment with card 4242 4242 4242 4242
7. Should redirect to /wallet?status=success
8. Balance should increase by £10.00
9. Transaction history shows "topup:stripe"
10. Check Stripe Dashboard for successful payment

## British English Copy

All user-facing text uses British English:
- "Top Up Wallet" (not "Top Off")
- £ symbol (pounds sterling)
- Dates formatted with UK locale (en-GB)

## Future Enhancements (Out of Scope)

- Payment method storage for repeat customers
- Apple Pay / Google Pay integration
- Refund handling
- Payment history export
- Currency conversion (multi-currency wallets)

## Installation

```bash
cd apps/golf
pnpm install
```

## Local Development

```bash
# Demo mode (no Stripe)
pnpm dev

# Stripe mode (with test keys)
# Add to apps/golf/.env.local:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3001
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Use Stripe CLI for local webhook testing:
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

---

**Implementation Complete** ✅

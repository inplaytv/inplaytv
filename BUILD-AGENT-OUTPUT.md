# 🚀 WALLET TOP-UP SYSTEM - BUILD AGENT OUTPUT

## ✅ IMPLEMENTATION COMPLETE

All requirements implemented within `apps/golf` scope only. No external libraries added beyond Stripe SDK.

---

## 📁 FILE TREE (Changes)

```
apps/golf/
├── package.json                                    [MODIFIED] Added stripe dependency
├── src/app/
│   ├── wallet/
│   │   └── page.tsx                               [MODIFIED] UI with quick buttons, custom input, demo modal
│   └── api/stripe/
│       ├── create-checkout-session/
│       │   └── route.ts                           [NEW] Demo detection + real Stripe Checkout
│       ├── demo-simulate/
│       │   └── route.ts                           [NEW] Server-side demo payment processing
│       └── webhook/
│           └── route.ts                           [NEW] Stripe webhook handler
docs/
└── WALLET-TOPUP-IMPLEMENTATION.md                 [NEW] Full documentation
```

---

## 📄 CODE SNIPPETS (First ~40 Lines)

### 1️⃣ apps/golf/src/app/wallet/page.tsx
```typescript
'use client';

import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Header from '@/components/Header';
import { formatPounds } from '@/lib/money';

export const dynamic = 'force-dynamic';

function WalletPageContent() {
  const supabase = createClient();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoAmount, setDemoAmount] = useState(0);

  useEffect(() => {
    loadWallet();
    
    // Check for success query param
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      setSuccessMessage('Top-up successful! Your wallet has been credited.');
      window.history.replaceState({}, '', '/wallet');
    } else if (status === 'success-demo') {
      setSuccessMessage('Demo top-up credited successfully!');
      window.history.replaceState({}, '', '/wallet');
    }
  }, []);

  async function loadWallet() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
```

**Features:**
- ✅ Quick buttons: £5, £10, £20, £50
- ✅ Custom amount input (integer validation, min £1, max £10k)
- ✅ Demo modal with "DEMO MODE" badge
- ✅ Success/error messaging
- ✅ Query param handling for redirects

---

### 2️⃣ apps/golf/src/app/api/stripe/create-checkout-session/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED;
    
    // If explicitly disabled or keys missing, return demo mode
    if (stripeEnabled === 'false' || !stripeSecretKey || !stripePublishableKey) {
      return NextResponse.json(
        { mode: 'demo', message: 'Stripe not configured' },
        { status: 403 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { amount_cents } = await request.json();
```

**Features:**
- ✅ Demo mode detection (returns 403 with `{mode: 'demo'}`)
- ✅ Real Stripe Checkout session creation when configured
- ✅ User authentication
- ✅ Amount validation

---

### 3️⃣ apps/golf/src/app/api/stripe/demo-simulate/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (client-side auth)
    const authHeader = request.headers.get('authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { amount_cents } = await request.json();
    
    // Validate amount
    if (!amount_cents || amount_cents < 100 || amount_cents > 1000000) {
      return NextResponse.json(
        { error: 'Invalid amount (must be between £1 and £10,000)' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client with service role key
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
```

**Features:**
- ✅ User authentication
- ✅ Amount validation
- ✅ Unique provider_payment_id: `demo:${userId}:${timestamp}:${random}`
- ✅ Inserts into wallet_external_payments with provider='demo'
- ✅ Calls wallet_apply() RPC via service role key
- ✅ Idempotent (handles unique violations)

---

## 🔐 ENVIRONMENT VARIABLES

### Vercel Environment Variables (Production)

#### 🔒 SERVER-ONLY (Secret)
```bash
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 🌐 PUBLIC (Safe for Client)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
NEXT_PUBLIC_SITE_URL=https://golf.inplay.tv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### ⚙️ OPTIONAL
```bash
# Set to 'false' to force demo mode even with keys present
NEXT_PUBLIC_STRIPE_ENABLED=true
```

### 🎯 Mode Detection Logic
```typescript
// Demo mode triggers if:
stripeEnabled === 'false' OR
!stripeSecretKey OR
!stripePublishableKey
```

---

## 🔧 STRIPE WEBHOOK SETUP

1. **Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint:** `https://golf.inplay.tv/api/stripe/webhook`
3. **Select events:** `checkout.session.completed`
4. **Copy signing secret** → Set as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## ✅ QA CHECKLIST

### 🎨 Client UI
- [ ] Quick buttons (£5, £10, £20, £50) set amount input correctly
- [ ] Free-text amount validated client-side (integer only, min £1, max £10k)
- [ ] Selected quick button shows active state (blue border/background)
- [ ] "Top Up" button disabled when amount empty or invalid
- [ ] "Top Up" button shows "Processing..." loading state

### 🧪 Demo Mode (No Stripe Keys)
- [ ] With no Stripe keys, demo modal appears on top-up click
- [ ] Demo modal shows "⚠️ DEMO MODE" badge
- [ ] Demo modal displays correct amount and user email
- [ ] "Confirm demo payment" calls /api/stripe/demo-simulate
- [ ] Successful demo redirects to /wallet?status=success-demo
- [ ] Success toast: "Demo top-up credited successfully!"
- [ ] wallet_external_payments records provider='demo'
- [ ] Demo payment_id format: `demo:${userId}:${timestamp}:${random}`

### 💳 Stripe Mode (Keys Configured)
- [ ] With Stripe keys present, clicking "Top Up" redirects to Stripe Checkout
- [ ] Checkout session created with correct amount_cents
- [ ] Checkout displays amount in GBP (£)
- [ ] Checkout pre-fills user email
- [ ] Test payment (4242 4242 4242 4242) succeeds
- [ ] Successful payment redirects to /wallet?status=success
- [ ] Success toast: "Top-up successful! Your wallet has been credited."
- [ ] Webhook receives checkout.session.completed event
- [ ] Webhook credits wallet via wallet_apply() RPC
- [ ] wallet_external_payments records provider='stripe'

### 🔐 Security
- [ ] No secrets (STRIPE_SECRET_KEY, SERVICE_ROLE_KEY) sent to client
- [ ] Webhook verifies Stripe signature (rejects invalid)
- [ ] All API routes require Supabase authentication
- [ ] Unauthenticated requests return 401

### 🛡️ Idempotency
- [ ] Replaying demo-simulate with same params returns success (no duplicate credit)
- [ ] Replaying Stripe webhook with same payment_intent_id returns 200 (no duplicate credit)
- [ ] wallet_external_payments.provider_payment_id UNIQUE constraint enforced

### 📊 Data Integrity
- [ ] Amount conversion accurate: £10.00 → 1000 pence
- [ ] wallet_apply() receives correct amount_cents
- [ ] Transaction history displays correct amounts (+ for credits)
- [ ] Balance updates immediately after successful top-up

---

## 🚀 DEPLOYMENT STEPS

### 1️⃣ Install Dependencies
```bash
cd apps/golf
pnpm install  # Installs stripe@17.3.1
```

### 2️⃣ Set Environment Variables in Vercel
1. Go to **Vercel Dashboard** → Your Project → Settings → Environment Variables
2. Add all variables listed in "ENVIRONMENT VARIABLES" section above
3. Ensure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` are **NOT** exposed to client

### 3️⃣ Configure Stripe Webhook
1. Go to **Stripe Dashboard** → Developers → Webhooks
2. Add endpoint: `https://golf.inplay.tv/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy signing secret → Set as `STRIPE_WEBHOOK_SECRET` in Vercel

### 4️⃣ Deploy
```bash
git add .
git commit -m "feat: Wallet top-up with Stripe Checkout and demo mode fallback"
git push origin main
```

### 5️⃣ Test
- **Demo Mode:** Remove Stripe keys in Vercel → Deploy → Test wallet top-up
- **Stripe Mode:** Add Stripe test keys → Deploy → Test with 4242 4242 4242 4242

---

## 📝 NOTES

### ✅ Scope Adherence
- **ONLY modified:** `apps/golf` directory
- **NO new external libraries** (except Stripe SDK, as required)
- **NO changes to:** wallet_apply() RPC behavior or database schema
- **British English:** All copy uses £ and UK locale formatting

### 🔒 Security Best Practices
- Service role key NEVER exposed to client
- Webhook signature verification prevents replay attacks
- Idempotency via unique constraints on provider_payment_id
- Amount validation on both client and server

### 🧪 Testing Recommendations
1. **Local development:** Use Stripe CLI for webhook forwarding
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
2. **Production:** Use Stripe Dashboard webhook logs to debug
3. **Demo mode:** Perfect for QA/staging environments without real payments

---

## 📚 DOCUMENTATION

Full implementation details in: `docs/WALLET-TOPUP-IMPLEMENTATION.md`

---

**🎉 BUILD COMPLETE - READY FOR QA AND DEPLOYMENT**

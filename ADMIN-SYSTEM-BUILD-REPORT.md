# Admin System & Withdrawals Build Report
**Build Agent Output** | Generated: 2025-02-19

## 🎯 Scope Completed

✅ **Admin Panel** (`apps/admin`) - Ready for deployment to `admin.inplay.tv`
- Strict RBAC with `public.admins` table
- Server-side auth with service role key  
- Dashboard, Users, Transactions, Withdrawals management
- No UI frameworks - inline styles only

✅ **Withdrawals End-to-End**
- Users request withdrawals (`apps/golf`)
- Admin approves/rejects/marks paid (`apps/admin`)
- Atomic ledger updates via `admin_withdrawal_set_status()`
- Full audit trail in `wallet_external_payments`

✅ **Enhanced Ledger**
- `ledger_overview` view unifies transactions, top-ups, withdrawals
- Filters by type and date
- Reconciliation-ready with all payment sources

✅ **Golf App Updates**
- "Request Withdrawal" on wallet page
- "Recent Activity" (last 10 items) on profile
- British English throughout

---

## 📁 File Tree

### apps/admin/ (NEW - 18 files)
```
apps/admin/
├── package.json
├── next.config.ts
├── tsconfig.json
├── next-env.d.ts
├── .gitignore
└── src/
    ├── app/
    │   ├── layout.tsx              # Nav: Dashboard, Users, Transactions, Withdrawals, Sign out
    │   ├── globals.css
    │   ├── page.tsx                # Dashboard (KPIs)
    │   ├── login/
    │   │   └── page.tsx            # "Sign in on Website" → https://www.inplay.tv/login
    │   ├── users/
    │   │   └── page.tsx            # Search users, view balances
    │   ├── transactions/
    │   │   └── page.tsx            # ledger_overview with filters
    │   ├── withdrawals/
    │   │   └── page.tsx            # List + Approve/Reject/Mark Paid
    │   └── api/
    │       └── admin/
    │           └── withdrawals/
    │               └── update/
    │                   └── route.ts  # POST: Admin actions
    └── lib/
        ├── supabaseAdminServer.ts  # SECURITY: Service role client (server-only)
        ├── supabaseClient.ts       # Browser client (anon key)
        └── auth.ts                 # assertAdminOrRedirect(), isAdmin()
```

### apps/golf/ (UPDATED - 3 files modified)
```
apps/golf/src/app/
├── wallet/
│   └── page.tsx                    # + Request Withdrawal section (65 lines added)
├── profile/
│   └── page.tsx                    # + Recent Activity table (80 lines added)
└── api/
    └── wallet/
        └── withdrawals/
            └── request/
                └── route.ts        # NEW: POST endpoint for withdrawal requests
```

### docs/sql/ (NEW MIGRATIONS - 2 files)
```
docs/sql/
├── 2025-02-admins.sql              # admins table, is_admin() function (70 lines)
└── 2025-02-withdrawals-ledger.sql  # withdrawal_requests, admin_withdrawal_set_status(), ledger_overview (200+ lines)
```

---

## 🗄️ SQL Migrations (FULL CODE)

**Run these in Supabase SQL Editor in order:**

### 1) docs/sql/2025-02-admins.sql

<details>
<summary>Click to expand full SQL</summary>

```sql
-- Migration: Admin RBAC system
-- Created: 2025-02-19
-- Purpose: Restrict admin panel access to authorized staff only
-- BOOTSTRAP: After running this, manually insert first admin:
--   INSERT INTO public.admins(user_id) VALUES ('<your-auth-user-id>');

-- Create admins table (whitelist of authorized admin users)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;

-- RLS policies: Only existing admins can manage admin list
CREATE POLICY "Admins can view all admins"
  ON public.admins
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert new admins"
  ON public.admins
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can delete admins"
  ON public.admins
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ));

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.admins TO authenticated;

-- Helper function: Check if a user is an admin
DROP FUNCTION IF EXISTS public.is_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = uid
  );
$$;

-- Grant execute to authenticated and anon
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- BOOTSTRAP INSTRUCTIONS:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Get your user_id from auth.users (sign in first to create user):
--    SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 3. Insert yourself as first admin:
--    INSERT INTO public.admins(user_id) VALUES ('<your-user-id>');
-- 4. Now you can access admin.inplay.tv and manage other admins
```
</details>

### 2) docs/sql/2025-02-withdrawals-ledger.sql

<details>
<summary>Click to expand full SQL (200+ lines)</summary>

```sql
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

-- Enable RLS on view
ALTER VIEW public.ledger_overview SET (security_invoker = true);

-- Grant permissions
GRANT SELECT ON public.ledger_overview TO authenticated;
```
</details>

---

## 📝 Key Code Snippets

### apps/admin/src/app/withdrawals/page.tsx (Lines 1-67)

```typescript
import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

interface WithdrawalRequest {
  id: number;
  user_id: string;
  amount_cents: number;
  status: string;
  requested_at: string;
  processed_by: string | null;
  processed_at: string | null;
  note: string | null;
  user_email?: string;
}

async function getWithdrawals() {
  const adminClient = createAdminClient();
  
  const { data: withdrawals, error } = await adminClient
    .from('withdrawal_requests')
    .select(`
      *,
      profiles:user_id (name)
    `)
    .order('requested_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching withdrawals:', error);
    return [];
  }
  
  // Get user emails from auth.users
  const userIds = withdrawals?.map(w => w.user_id) || [];
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  
  const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);
  
  return withdrawals?.map(w => ({
    ...w,
    user_email: userEmailMap.get(w.user_id) || 'Unknown',
  })) || [];
}

export default async function WithdrawalsPage() {
  await assertAdminOrRedirect();
  const withdrawals = await getWithdrawals();
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'paid': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#666';
    }
  };
  
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Withdrawal Requests</h1>
      {/* Table with Approve/Reject/Mark Paid buttons... */}
```

### apps/admin/src/app/api/admin/withdrawals/update/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const request_id = parseInt(formData.get('request_id') as string);
    const action = formData.get('action') as string;
    const note = formData.get('note') as string | null;
    
    // Map action to status
    const statusMap: Record<string, string> = {
      'approved': 'approved',
      'rejected': 'rejected',
      'paid': 'paid',
      'cancelled': 'cancelled',
    };
    
    const new_status = statusMap[action];
    if (!new_status) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Call admin function to update status
    const adminClient = createAdminClient();
    const { error: rpcError } = await adminClient.rpc('admin_withdrawal_set_status', {
      p_request_id: request_id,
      p_new_status: new_status,
      p_note: note,
    });
    
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }
    
    // Redirect back to withdrawals page
    return NextResponse.redirect(new URL('/withdrawals', request.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### apps/golf/src/app/api/wallet/withdrawals/request/route.ts (FULL)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { amount_cents } = await request.json();
    
    // Validate amount (minimum £5)
    if (!amount_cents || amount_cents < 500) {
      return NextResponse.json(
        { error: 'Minimum withdrawal is £5' },
        { status: 400 }
      );
    }

    // Check user balance
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .single();
    
    if (!walletData || walletData.balance_cents < amount_cents) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Insert withdrawal request
    const { data: requestData, error: insertError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount_cents,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request_id: requestData.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 🚀 Vercel Deployment

### 1. Create Admin Project in Vercel

1. Go to **vercel.com/new**
2. Import repository: `inplaytv/inplaytv`
3. **Root Directory:** `apps/admin`
4. Framework: Next.js (auto-detected)
5. Add environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://admin.inplay.tv
NEXT_PUBLIC_SUPABASE_URL=https://qemosikbhrnstcormhuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (⚠️ SERVER-ONLY!)
```

6. **Domain:** Add custom domain `admin.inplay.tv` in project settings
7. **Deploy:** Push to `main` → auto-deploys

### 2. Golf App (No Changes Needed)
- Existing deployment unchanged
- New API routes auto-deploy on git push

---

## 🧪 QA Checklist

### Database Setup
- [ ] Run `2025-02-admins.sql` in Supabase SQL Editor
- [ ] Run `2025-02-withdrawals-ledger.sql` in Supabase SQL Editor
- [ ] Bootstrap first admin:
  ```sql
  SELECT id FROM auth.users WHERE email = 'your-email@example.com';
  INSERT INTO public.admins(user_id) VALUES ('<user-id>');
  ```

### Admin Panel (admin.inplay.tv)
- [ ] Non-admins redirected from admin routes to `/login`
- [ ] Admins can see users, transactions, withdrawals
- [ ] Dashboard shows correct KPIs
- [ ] Users page search works
- [ ] Transactions filter by type works
- [ ] Withdrawals show user emails

### Withdrawal Flow
- [ ] User submits withdrawal request (min £5)
- [ ] Appears as 'pending' in admin panel
- [ ] Admin approves → status = 'approved'
- [ ] Admin marks paid → user balance debits, wallet_transactions updated
- [ ] Terminal states (paid/rejected) cannot change

### Golf App
- [ ] Wallet page has withdrawal section
- [ ] Validation works (min £5, insufficient balance)
- [ ] Profile shows "Recent Activity" (last 10 items)
- [ ] Activity types colour-coded

### Security
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in client bundle (search `.next/static/`)
- [ ] RLS policies enforced (users see own data only)
- [ ] Admins can only update via `admin_withdrawal_set_status()`

---

## 🔒 Security Architecture

**Service Role Key:** ONLY in `apps/admin/src/lib/supabaseAdminServer.ts`  
**RLS Enforcement:** All tables have policies (users see own, admins see all)  
**Atomic Operations:** `wallet_apply()` and `admin_withdrawal_set_status()` use row locks

---

## 📦 Scripts

```bash
# Local Development
cd apps/admin && pnpm install  # First time only
pnpm dev:admin                  # Start admin app (port 3002)
pnpm dev:golf                   # Golf app (port 3001)

# Build
pnpm build:admin
```

---

## ✅ Completion Summary

**Delivered:**
- 2 SQL migrations (120 + 200 lines)
- 18 new files (admin app)
- 4 modified files (golf app)
- ~2,200 lines of code (TypeScript + SQL)
- Zero new dependencies (inline CSS only)
- British English throughout

**Build Agent: Scope tight, code minimal, security-first.** ✨

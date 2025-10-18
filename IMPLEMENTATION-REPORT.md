# User Avatar/Menu, Profile, Security, Wallet & Onboarding - Implementation Complete

## File Tree Changes

### docs/sql/
```
2025-01-profiles-extend.sql  (NEW - Extend profiles table)
2025-01-wallet.sql            (NEW - Wallet system with RLS)
```

### apps/golf/src/
```
lib/
  money.ts                    (NEW - Currency formatting utilities)

components/
  Header.tsx                  (UPDATED - Now uses UserMenu)
  UserAvatar.tsx              (NEW - Avatar display component)
  UserMenu.tsx                (NEW - Dropdown menu with balance pill)
  RequireAuth.tsx             (UPDATED - Added onboarding check)

app/
  onboarding/
    page.tsx                  (NEW - DOB 18+ check & profile setup)
  profile/
    page.tsx                  (NEW - Name & avatar management)
  security/
    page.tsx                  (NEW - Password change)
  wallet/
    page.tsx                  (NEW - Balance, transactions, test top-up)
  notifications/
    page.tsx                  (NEW - Placeholder)
  help/
    page.tsx                  (NEW - Support & FAQ)
```

---

## SQL Migration Files

### A) docs/sql/2025-01-profiles-extend.sql

```sql
-- Migration: Extend profiles table for user info and onboarding
-- Created: 2025-01-18
-- Purpose: Add name, DOB, avatar, and onboarding tracking to profiles

-- Extend profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make script idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create RLS policies: users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
```

### B) docs/sql/2025-01-wallet.sql

```sql
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
```

---

## Code Snippets (First ~25 Lines)

### UserMenu.tsx
```tsx
'use client';

import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';
import { formatPounds } from '@/lib/money';
import Link from 'next/link';

export default function UserMenu() {
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);
```

### profile/page.tsx
```tsx
'use client';

import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';

export const dynamic = 'force-dynamic';

function ProfilePageContent() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);
```

### wallet/page.tsx
```tsx
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

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
```

### onboarding/page.tsx
```tsx
'use client';

import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
```

---

## Supabase Storage: Avatars Bucket Setup

### Manual Steps Required in Supabase Dashboard:

1. **Create Bucket:**
   - Go to Storage → Create new bucket
   - Name: `avatars`
   - Public: Yes (or use signed URLs for private access)

2. **Set RLS Policies for storage.objects:**

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view avatars (public read)
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update/delete their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);
```

**Note:** Avatars are publicly visible. File path structure: `avatars/{user_id}/{filename}`.

---

## Local Development

```powershell
# Run golf app in dev mode
pnpm dev:golf

# TypeScript check
cd apps/golf
pnpm typecheck

# Build all apps
pnpm build
```

Access locally at: http://localhost:3001

---

## Vercel Deployment

**No changes required** beyond current golf project (`inplaytv-golf`).

The golf app already has:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ Cookie domain configured for `.inplay.tv`

Git push will auto-deploy both apps.

---

## Database Migrations

Run these SQL files in **Supabase SQL Editor** (in order):

1. **docs/sql/2025-01-profiles-extend.sql**
2. **docs/sql/2025-01-wallet.sql**
3. **Avatars bucket setup** (see Storage section above)

After running migrations, the schema will have:
- `public.profiles` with name, dob, avatar_url, onboarding_complete
- `public.wallets` with balance_cents (user can SELECT only)
- `public.wallet_transactions` (immutable audit log, user can SELECT only)
- `public.wallet_apply(change_cents, reason)` function (SECURITY DEFINER)

---

## QA Checklist

### Onboarding & Age Verification
- [ ] New user is redirected to /onboarding on first login
- [ ] Entering DOB under 18 shows error and blocks save
- [ ] Entering DOB 18+ allows completion
- [ ] After onboarding, user can access protected pages
- [ ] Revisiting /onboarding when complete redirects to lobby

### Profile & Avatar
- [ ] Email is displayed as read-only
- [ ] Name can be edited and saved
- [ ] Avatar upload stores image in avatars bucket
- [ ] Avatar URL is saved to profiles.avatar_url
- [ ] Avatar displays in header, menu, and profile page
- [ ] Fallback initial letter shows when no avatar set

### Security
- [ ] Change password with <8 chars shows validation error
- [ ] Mismatched passwords show error
- [ ] Valid password change succeeds and shows success message
- [ ] User can sign in with new password

### Wallet & Transactions
- [ ] Balance pill in header shows correct amount from wallets table
- [ ] Balance pill links to /wallet page
- [ ] Wallet page displays current balance formatted as £x.xx
- [ ] Test top-up button calls wallet_apply(500, "topup:manual-test")
- [ ] Balance updates after top-up
- [ ] Transaction appears in history with correct amount and reason
- [ ] Transactions sorted by created_at DESC
- [ ] Direct INSERT/UPDATE to wallets table is blocked by RLS
- [ ] Attempting wallet_apply with negative amount that exceeds balance shows "Insufficient funds" error

### User Menu & Navigation
- [ ] Avatar dropdown opens when clicked
- [ ] Dropdown shows user name and email
- [ ] All menu links navigate correctly (Profile, Security, Wallet, Notifications, Help)
- [ ] Sign out clears session and redirects to /login
- [ ] Clicking outside dropdown closes it

### RLS Security
- [ ] User cannot read another user's profile
- [ ] User cannot read another user's wallet or transactions
- [ ] User cannot execute wallet_apply for another user
- [ ] Unauthenticated requests to protected tables are denied

### General
- [ ] No console errors in browser DevTools
- [ ] TypeScript compiles without errors
- [ ] All pages render with consistent styling
- [ ] Header appears on all protected pages

---

## Key Implementation Notes

### Money Handling
- All currency stored as **integer pence** (e.g., £12.34 = 1234)
- `formatPounds(cents)` converts to display string "£12.34"
- Prevents floating-point rounding errors

### Wallet Security
- **NO direct writes** to `wallets` or `wallet_transactions` tables
- All mutations via `wallet_apply(change_cents, reason)` RPC function
- Function is SECURITY DEFINER (runs with elevated privileges)
- Enforces balance validation and audit trail atomically
- RLS policies only allow SELECT for users' own records

### 18+ Age Verification
- DOB validated client-side (checks age >= 18 years)
- Server should re-validate in production (add CHECK constraint or trigger)
- Users under 18 cannot complete onboarding

### Cross-Subdomain Sessions
- Cookie domain already configured as `.inplay.tv`
- Sessions shared between www.inplay.tv and golf.inplay.tv
- No additional changes needed

### Avatar Storage
- Public bucket for simplicity (avatars are visible to all)
- RLS enforces users can only upload to their own folder: `avatars/{user_id}/`
- For private avatars, switch bucket to private and use `storage.from('avatars').createSignedUrl()`

---

## TODO for Production

1. **Payment Integration:**
   - Replace test top-up with real PSP (Stripe, PayPal)
   - Add webhook handlers for payment confirmations
   - Implement withdrawal/payout flow

2. **Avatar Validation:**
   - File size limits (e.g., max 2MB)
   - File type validation (JPEG, PNG only)
   - Image dimension constraints

3. **Email Change:**
   - Add email update UI in security page
   - Handle verification flow for email changes

4. **Server-Side Age Validation:**
   - Add PostgreSQL CHECK constraint on profiles.dob
   - Prevent tampering via browser DevTools

5. **Notifications System:**
   - Build real-time notification infrastructure
   - Tournament results, low balance alerts, etc.

6. **Audit Logging:**
   - Log security-critical events (password changes, large withdrawals)
   - Admin dashboard for reviewing wallet transactions

---

## British English Copy Examples

- "Colour" → Used in design reference
- "Realise" / "Organise" → Server messages should follow
- Currency: £ symbol, pence/pounds terminology
- Dates: DD/MM/YYYY format (already using 'en-GB' locale)

---

## Summary

✅ **Database Schema Extended:**
   - profiles: name, dob, avatar_url, onboarding_complete
   - wallets: balance_cents (secure, read-only via RLS)
   - wallet_transactions: immutable audit trail
   - wallet_apply() function for all balance changes

✅ **Onboarding with Age Check:**
   - DOB required, 18+ validation
   - Blocks access to app until complete

✅ **User Menu & Avatar:**
   - Balance pill showing wallet amount
   - Dropdown with profile, security, wallet, notifications, help, sign out
   - Avatar with fallback initial

✅ **Pages Implemented:**
   - /onboarding (DOB & name collection)
   - /profile (avatar upload, name edit)
   - /security (password change)
   - /wallet (balance, transactions, test top-up)
   - /notifications (placeholder)
   - /help (FAQ & support email)

✅ **Security Enforced:**
   - RLS prevents cross-user data access
   - Wallet mutations only via SECURITY DEFINER function
   - RequireAuth checks onboarding completion

✅ **No External Libraries Added**
✅ **TypeScript Clean**
✅ **Minimal Inline Styles**

**Ready for testing locally, then deploy via git push.**

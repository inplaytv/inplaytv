# Wallet System Setup Instructions

## Problem
Getting error: `Failed to process payment: relation "wallets" does not exist`

## Solution
Run these SQL scripts in Supabase SQL Editor (in order):

### Step 1: Create Wallet Tables & Functions
Open: `docs/sql/2025-01-wallet.sql`

This creates:
- `wallets` table (stores user balance)
- `wallet_transactions` table (audit log)
- `wallet_apply()` function (secure balance changes)
- RLS policies

### Step 2: Create Helper Functions
Open: `scripts/create-atomic-wallet-deduction.sql`

This creates:
- `deduct_from_wallet()` function (used by entry purchase API)

### Step 3: Verify Installation
Run this query to check:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('wallets', 'wallet_transactions');

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('wallet_apply', 'deduct_from_wallet');
```

Should return:
- 2 tables: wallets, wallet_transactions
- 2 functions: wallet_apply, deduct_from_wallet

## After Running SQL
Refresh your golf app page and try purchasing again. The wallet will auto-create with £0 balance when you first authenticate.

## Adding Test Money
To add money to your wallet for testing:

```sql
-- Add £100 to your wallet (replace 'your-user-id-here' with your actual user ID)
SELECT wallet_apply(10000, 'test:manual-topup') 
WHERE auth.uid() = 'your-user-id-here'::uuid;
```

Or use the Stripe demo mode on `/wallet` page.

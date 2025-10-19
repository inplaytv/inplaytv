# LOCAL TESTING GUIDE - Admin Panel & Withdrawal System

## 🚀 Apps Running

- **Golf App:** http://localhost:3001 (main user app)
- **Admin Panel:** http://localhost:3002 (staff only)

## 📋 Testing Checklist

### 1️⃣ **Database Setup** (ONE-TIME)

Run these SQL migrations in Supabase SQL Editor (https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/sql/new):

```sql
-- A. Create admins table and RBAC
\i docs/sql/2025-02-admins.sql

-- B. Create withdrawals system
\i docs/sql/2025-02-withdrawals-ledger.sql

-- C. Update wallet_apply function
\i scripts/2025-01-wallet-update-function.sql
```

Or copy/paste each file's contents directly into SQL Editor.

### 2️⃣ **Create Test User Account**

1. Go to http://localhost:3001
2. Click **"Sign Up"**
3. Enter email/password (e.g., `admin@test.com` / `password123`)
4. Check your email for verification link
5. Click verification link

### 3️⃣ **Bootstrap Admin Access**

1. Open Supabase SQL Editor
2. Find your user ID:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'admin@test.com';
   ```
3. Copy the UUID (e.g., `12345678-1234-1234-1234-123456789abc`)
4. Make yourself an admin:
   ```sql
   INSERT INTO public.admins(user_id) VALUES ('12345678-1234-1234-1234-123456789abc');
   ```
5. Verify:
   ```sql
   SELECT * FROM public.admins;
   ```

### 4️⃣ **Test Admin Panel Login**

1. Go to http://localhost:3002
2. Should redirect to `/login`
3. Sign in with your test account (`admin@test.com`)
4. Should redirect to admin dashboard
5. You should see:
   - **Total Users** card
   - **Total Balance** card
   - **Pending Withdrawals** card

**If you get an error:**
- Check the terminal running `pnpm dev` in `apps/admin`
- Look for the actual error message in server logs
- Verify `.env.local` exists in `apps/admin` folder

### 5️⃣ **Add Funds to Test Wallet**

1. Stay in golf app (http://localhost:3001)
2. Go to **Profile** → **Wallet**
3. Click **"Demo: Add $50"** (simulates Stripe payment)
4. Verify balance shows $50.00

### 6️⃣ **Test Withdrawal Request (Golf App)**

1. In golf app, go to **Wallet** page
2. Under "Request Withdrawal" section:
   - Enter amount: `25.00`
   - Click **"Request Withdrawal"**
3. Success message should appear
4. Check **Profile** page → **Recent Activity** section
5. Should see withdrawal request with status: `pending`

### 7️⃣ **Test Withdrawal Approval (Admin Panel)**

1. Go to http://localhost:3002/withdrawals
2. You should see your withdrawal request
3. Actions:
   - **Approve** → Changes status to `approved`
   - **Reject** → Changes status to `rejected` (no wallet change)
   - **Mark Paid** → Changes status to `paid` AND debits wallet

4. Click **"Mark Paid"** on your withdrawal
5. Optional: Add processing note
6. Confirm

### 8️⃣ **Verify Wallet Debit**

1. Go back to golf app (http://localhost:3001)
2. Check **Wallet** page
3. Balance should now be $25.00 (was $50, withdrew $25)
4. Go to **Profile** page → **Recent Activity**
5. Should see:
   - Withdrawal request (status: `paid`)
   - External payment (+$50)
   - Wallet transaction (-$25) for withdrawal

### 9️⃣ **Test Admin Panel Pages**

Visit all pages to ensure no errors:

- http://localhost:3002/ (Dashboard)
- http://localhost:3002/users (All users list)
- http://localhost:3002/transactions (All wallet transactions)
- http://localhost:3002/withdrawals (Withdrawal requests)

## 🐛 Troubleshooting

### Error: "Not authenticated"
- Ensure SQL migrations are run (wallet_apply function update)
- Check `SUPABASE_SERVICE_ROLE_KEY` exists in `.env.local`

### Error: "Application error: a server-side exception has occurred"
- Check terminal logs where admin app is running
- Verify `.env.local` exists in `apps/admin/` folder
- Ensure all 3 SQL migrations are applied

### Can't login to admin panel
- Make sure you bootstrapped admin user (step 3)
- Verify with: `SELECT * FROM public.admins;`
- Check user exists: `SELECT * FROM auth.users;`

### Withdrawal not showing in admin panel
- Check: `SELECT * FROM withdrawal_requests;`
- Verify RLS policies allow viewing

### Wallet not debiting on "Mark Paid"
- Check terminal logs for errors
- Verify `wallet_apply` function was updated
- Check: `SELECT * FROM wallet_transactions ORDER BY created_at DESC;`

## 🔍 Useful SQL Queries

```sql
-- View all withdrawal requests
SELECT * FROM withdrawal_requests ORDER BY requested_at DESC;

-- View complete ledger (all wallet activity)
SELECT * FROM ledger_overview WHERE user_id = '<your-user-id>' ORDER BY created_at DESC;

-- Check wallet balance
SELECT balance_cents FROM wallets WHERE user_id = '<your-user-id>';

-- List all admins
SELECT a.user_id, u.email FROM admins a JOIN auth.users u ON u.id = a.user_id;

-- Reset wallet for testing
UPDATE wallets SET balance_cents = 5000 WHERE user_id = '<your-user-id>';
```

## ✅ Expected Flow

1. User has $50 in wallet
2. User requests $25 withdrawal → Status: `pending`
3. Admin sees request in dashboard
4. Admin clicks "Mark Paid" → Status: `paid`
5. User wallet debited: $50 - $25 = $25
6. Transaction appears in Recent Activity
7. Withdrawal appears in ledger_overview

## 🔐 Security Notes

- Admin panel uses service_role key (server-side only)
- RLS enforced on all tables
- Only users in `admins` table can access admin panel
- Withdrawal status changes are atomic (uses DB function)

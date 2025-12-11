# ⚠️ MAINTENANCE MODE NOT WORKING - QUICK FIX

## The Problem

The middleware code is trying to query the `site_settings` table, but **the table doesn't exist in your database yet**.

## The Solution (3 Steps)

### ✅ Step 1: Create the Database Table

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to SQL Editor** (left sidebar)
3. **Copy and paste** the contents of `scripts/create-site-settings-table.sql`
4. **Click "Run"**

You should see: `✅ Site settings table created!`

### ✅ Step 2: Restart Your Dev Servers

Kill all Node processes and restart:

```powershell
# Stop all dev servers
Get-Process node | Stop-Process -Force

# Start dev servers
pnpm dev
```

Or just restart the terminals running:
- `pnpm dev:web` (port 3000)
- `pnpm dev:golf` (port 3001)  
- `pnpm dev:admin` (port 3002)

### ✅ Step 3: Test It

1. **Go to Admin Panel**: http://localhost:3002
2. **Navigate to**: Settings → Site
3. **Click "Coming Soon"** button
4. **Open incognito window**: http://localhost:3000
5. **You should see**: The coming-soon page with rocket emoji 🚀

## Why This Happened

The middleware code was deployed before the database table was created. The code is correct, but it needs the database setup first.

## Verification

After running the SQL script, you can verify the table exists:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM public.site_settings;
```

You should see:
```
setting_key      | setting_value | updated_at
maintenance_mode | live          | 2024-12-11 ...
```

## Still Having Issues?

If it's still not working after these steps:

1. **Check environment variable** in `apps/web/.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Check browser console** for errors (F12)

3. **Check terminal logs** when accessing the site

4. **Verify you're an admin**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM public.admins WHERE user_id = 'your-user-id';
   ```

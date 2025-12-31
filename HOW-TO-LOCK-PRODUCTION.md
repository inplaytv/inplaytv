# HOW TO LOCK PRODUCTION SITE TO ADMIN-ONLY ACCESS

## Current Status
- ✅ **Existing site settings page** - Use `http://localhost:3002/settings/site` to manage access
- ✅ **Production fix ready** - Middleware will redirect properly (no more localhost URLs)
- ❌ **Production currently OPEN** - General users can still login

## IMMEDIATE ACTION - Lock Production Site

### Step 1: Run SQL in Production Supabase
Go to https://supabase.com → Your Project → SQL Editor → New Query

```sql
UPDATE site_settings 
SET setting_value = 'maintenance' 
WHERE setting_key IN ('site_mode', 'maintenance_mode');
```

This locks the site to admin-only access immediately.

### Step 2: Verify It Worked
```sql
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key IN ('site_mode', 'maintenance_mode');
```

Both should show `'maintenance'`.

### Step 3: Test
- Open incognito browser
- Visit https://golf.inplay.tv
- You should see maintenance page (or be redirected to www.inplay.tv/maintenance)
- Non-admin users cannot access the site
- You (leroyg@live.com) can still login and access everything

## How to Use Existing Site Settings Page

Visit `http://localhost:3002/settings/site` (or `admin.inplay.tv/settings/site` in production)

**Three Mode Buttons:**
1. **🌐 Live** - Anyone can access and register (public launch)
2. **🔔 Coming Soon** - Shows waitlist page (admins bypass)
3. **🔒 Maintenance** - Admin-only access (what you want now)

Click the mode button to change instantly.

## Grant/Revoke Admin Access (SQL Method)

### Grant Admin to User
```sql
-- Find user ID
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Grant admin (replace USER-ID)
INSERT INTO admins (user_id, created_at)
VALUES ('USER-ID-HERE', NOW())
ON CONFLICT (user_id) DO NOTHING;
```

### Revoke Admin
```sql
DELETE FROM admins 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
```

### List All Admins
```sql
SELECT u.email, a.created_at as admin_since
FROM admins a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC;
```

## What Was Fixed

### The Problem
Production middleware was redirecting to hardcoded `http://localhost:3000/maintenance` instead of using the actual domain.

### The Fix
**File**: `apps/golf/src/middleware.ts` line 127-137

```typescript
// OLD (broken in production):
const webUrl = process.env.NEXT_PUBLIC_WEB_URL || `https://www.${request.nextUrl.hostname.replace('golf.', '')}`;

// NEW (fixed):
const hostname = request.nextUrl.hostname;
let webUrl;

// Handle localhost differently
if (hostname === 'localhost' || hostname === '127.0.0.1') {
  webUrl = 'http://localhost:3000';
} else {
  webUrl = process.env.NEXT_PUBLIC_WEB_URL || `https://www.${hostname.replace('golf.', '')}`;
}
```

Now production will properly redirect from `golf.inplay.tv` → `www.inplay.tv/maintenance`.

## Ready to Commit

Only commit these changes:
1. ✅ Middleware redirect fix (golf app)
2. ✅ Documentation (this file)

**DO NOT commit incomplete security settings page** - already removed.

## Testing in Production

After committing and Vercel deploys:
1. Run the SQL to enable maintenance mode (see Step 1 above)
2. Visit https://golf.inplay.tv in incognito - should show maintenance
3. Login with leroyg@live.com - should bypass and access full site
4. Have a test user try to login - should be blocked

---

**Everything else already works** - use the existing Site Settings page in admin for ongoing management.

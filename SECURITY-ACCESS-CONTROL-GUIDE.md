# Security & Access Control System

## Quick Reference

### 🔒 Lock Site to Admin-Only Access

Run in **Production Supabase SQL Editor**:

```sql
-- Enable maintenance mode (admin-only access)
UPDATE site_settings 
SET setting_value = 'maintenance' 
WHERE setting_key IN ('site_mode', 'maintenance_mode');
```

### 🌐 Open Site to Public

```sql
-- Disable maintenance mode (anyone can access)
UPDATE site_settings 
SET setting_value = 'live' 
WHERE setting_key IN ('site_mode', 'maintenance_mode');
```

### 👤 Grant Admin Access to User

```sql
-- Step 1: Find the user's ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'user@example.com';

-- Step 2: Grant admin access (replace USER-ID-FROM-ABOVE)
INSERT INTO admins (user_id, created_at)
VALUES ('USER-ID-FROM-ABOVE', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify
SELECT a.user_id, u.email, a.created_at
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE u.email = 'user@example.com';
```

### ❌ Revoke Admin Access

```sql
-- Find admin by email
SELECT a.user_id, u.email 
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE u.email = 'user@example.com';

-- Revoke access (replace USER-ID)
DELETE FROM admins WHERE user_id = 'USER-ID-HERE';
```

### 📋 List All Admins

```sql
SELECT 
  u.email,
  u.created_at as user_since,
  a.created_at as admin_since
FROM admins a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC;
```

### 📊 List All Users

```sql
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN a.user_id IS NOT NULL THEN 'Admin'
    ELSE 'User'
  END as role
FROM auth.users u
LEFT JOIN admins a ON a.user_id = u.id
ORDER BY u.created_at DESC;
```

## How It Works

### Authentication Flow

1. **inplay.tv** → Redirects to **www.inplay.tv/coming-soon** (or **www.inplay.tv** if live)
2. Click "Login" → **www.inplay.tv/login**
3. After successful login → **golf.inplay.tv/** (main game app)

### Access Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **live** | Anyone can access, register, and play | Public launch |
| **coming_soon** | Shows waitlist page, admins bypass | Pre-launch marketing |
| **maintenance** | Admin-only access, others see maintenance page | Private testing, updates |

### Domain Structure

- **www.inplay.tv** - Marketing site (handles auth, coming soon, maintenance)
- **golf.inplay.tv** - Main game app (tournaments, team building, leaderboards)
- **admin.inplay.tv** - Admin dashboard (localhost:3002 in dev)

### Middleware Protection

Both `apps/web/src/middleware.ts` and `apps/golf/src/middleware.ts` check the `site_settings` table on every request and enforce access control. Admins bypass all restrictions.

## Current Status

✅ **You (leroyg@live.com)** are configured as admin in production
✅ **Middleware** properly redirects non-admins in maintenance mode
✅ **Login/signup pages** always accessible (even in maintenance mode)
✅ **Localhost hardcoded URLs** fixed in middleware

## Quick Tasks

### Test Maintenance Mode
1. Enable maintenance mode in Supabase (see above)
2. Open incognito browser → visit **golf.inplay.tv**
3. Should redirect to **www.inplay.tv/maintenance**
4. Login with your admin account → should access full site

### Grant Access to Specific Users
1. User registers account at **www.inplay.tv/signup**
2. Run "Grant Admin Access" SQL (see above)
3. User can now access site even in maintenance mode

### Monitor Access
```sql
-- See who's logged in recently
SELECT 
  u.email,
  u.last_sign_in_at,
  CASE WHEN a.user_id IS NOT NULL THEN '✅ Admin' ELSE '👤 User' END as role
FROM auth.users u
LEFT JOIN admins a ON a.user_id = u.id
WHERE u.last_sign_in_at > NOW() - INTERVAL '7 days'
ORDER BY u.last_sign_in_at DESC;
```

## Future: Admin Security Panel

A web UI for managing access is in progress at `apps/admin/src/app/settings/security/` but requires API routes. For now, use SQL commands above.

When completed, you'll be able to:
- Toggle site mode with one click (Live/Coming Soon/Maintenance)
- Grant/revoke admin access from a user list
- View all users and their roles
- Monitor login activity

## Troubleshooting

### "Still seeing maintenance page after disabling it"
- Middleware caches setting for 30 seconds
- Wait 30 seconds or clear browser cache

### "Getting redirected to localhost in production"
- Fixed in this update - middleware now uses proper domain detection
- Push changes to Vercel

### "Can't login during maintenance mode"
- Login pages should always be accessible
- Check middleware allows `/login` and `/signup` routes

### "Lost admin access"
- Run this in Supabase SQL Editor:
  ```sql
  INSERT INTO admins (user_id, created_at)
  SELECT id, NOW() FROM auth.users WHERE email = 'leroyg@live.com'
  ON CONFLICT (user_id) DO NOTHING;
  ```

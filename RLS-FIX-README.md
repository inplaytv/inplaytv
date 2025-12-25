# RLS Security Issues - FIXED ✅

## Issues Resolved
This fix addresses the following Supabase security linter issues:

### 1. ✅ tournament_sync_history - RLS Disabled
- **Issue**: Table was public but RLS was not enabled
- **Fix**: Enabled RLS + Created admin-only access policies
- **Impact**: Only admins can view/modify sync history (used for DataGolf sync tracking)

### 2. ✅ settings - RLS Disabled  
- **Issue**: Settings table was public but RLS was not enabled
- **Fix**: Enabled RLS + Created public read / admin write policies
- **Impact**: Anyone can read settings, only admins can modify

## How to Apply the Fix

### Option 1: Direct SQL (Recommended)
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file `FIX-RLS-SECURITY-ISSUES.sql`
4. Copy all contents
5. Paste into SQL Editor and click **Run**
6. Verify success messages appear

### Option 2: Using Node.js Script
```powershell
node apply-rls-fix.js
```

### Option 3: Using PowerShell Script
```powershell
.\apply-rls-fix.ps1
```

## What the Fix Does

### tournament_sync_history Table
```sql
-- Enables RLS
ALTER TABLE tournament_sync_history ENABLE ROW LEVEL SECURITY;

-- Creates 3 policies:
1. "Admins can view sync history" - SELECT access for admins
2. "Admins can insert sync history" - INSERT access for sync APIs
3. "Admins can update sync history" - UPDATE access for admins
```

**Admin Check**: All policies verify `auth.uid()` exists in `public.admins` table

### settings Table (if exists)
```sql
-- Enables RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Creates 2 policies:
1. "Anyone can view settings" - Public read access (SELECT)
2. "Only admins can modify settings" - Admin-only write access (ALL)
```

## Verification

After applying, you can verify in Supabase:

1. **Database** → **Tables** → Select `tournament_sync_history`
2. Check that **RLS is enabled** (shield icon)
3. Click **Policies** tab to see the 3 policies created
4. Repeat for `settings` table

Or run this query in SQL Editor:
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tournament_sync_history', 'settings');
```

## About the 5 Warnings ⚠️

You mentioned there are **5 warnings** in addition to these 2 errors. To fix those, I need to know:

1. What are the warnings about?
2. Which tables/entities do they reference?

**Common Supabase Warnings:**
- Missing indexes on foreign keys
- Inefficient queries
- Duplicate indexes
- Missing constraints
- Auth policies issues

### To Get Warning Details:
1. Go to **Supabase Dashboard**
2. Click **Advisors** or **Linter** in left sidebar
3. Take a screenshot or copy the warning text
4. Share with me so I can create fixes

## Security Model

### Admin Detection
All policies use this pattern:
```sql
EXISTS (
  SELECT 1 FROM public.admins
  WHERE user_id = auth.uid()
)
```

This checks if the current authenticated user exists in the `admins` table.

### Policy Types
- **SELECT**: Controls who can read data
- **INSERT**: Controls who can create records
- **UPDATE**: Controls who can modify records  
- **ALL**: Controls all operations (shorthand for INSERT/UPDATE/DELETE)

## Testing the Fix

### Test Admin Access (in admin app)
1. Login as admin user
2. Go to tournament lifecycle or sync pages
3. Verify sync history displays correctly
4. Verify settings can be modified

### Test Public Access (in golf app)
1. Access as non-admin user
2. Verify site settings still work (maintenance mode, etc)
3. Verify no errors in browser console

## Need Help?

If you encounter issues:

1. **Check Supabase Logs**: Dashboard → Logs → Query Logs
2. **Verify Admin Status**: Run this query:
   ```sql
   SELECT * FROM admins WHERE user_id = auth.uid();
   ```
3. **Check Policy Conflicts**: Ensure no old policies exist
4. **Review Error Messages**: Supabase errors are usually descriptive

## Next Steps

- [ ] Apply this RLS fix
- [ ] Verify both tables show RLS enabled
- [ ] Share the 5 warning details for me to fix
- [ ] Test admin and public access still works
- [ ] Check Supabase linter shows issues resolved

---

**Created**: 2024-12-24  
**Status**: ✅ Ready to Apply  
**Impact**: Security hardening - No functional changes

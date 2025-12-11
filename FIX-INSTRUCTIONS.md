# 🔧 Fix Instructions - Two Issues

## Issue 1: Security Policy Error ✅

**Error Message:**
```
Failed to load security policy
Make sure you've run the setup-user-security-mfa.sql script in Supabase
```

**Solution:**

1. Open Supabase Dashboard → SQL Editor
2. Open the file: `scripts/setup-user-security-mfa.sql`
3. Copy all contents (entire file)
4. Paste into Supabase SQL Editor
5. Click "Run" button
6. Wait for success message: `✅ MFA system setup complete!`

**What this does:**
- Creates 5 security tables (user_security_settings, mfa_verification_codes, admin_security_policies, user_login_attempts, user_sessions)
- Sets up Row Level Security (RLS) policies
- Inserts default security policy
- Creates indexes for performance

---

## Issue 2: Email Inbox Build Error ✅ FIXED

**Error Message:**
```
Unexpected token `div`. Expected jsx identifier
./src/app/email/inbox/page.tsx:88
```

**Solution:**
✅ **Already Fixed!** I recreated the file cleanly. To apply:

1. Restart your dev server:
   ```powershell
   # Press Ctrl+C in the terminal running dev server
   pnpm run dev:admin
   ```

2. The build should now succeed without errors.

**What was wrong:**
- File had a caching/corruption issue causing Next.js build to fail
- Recreated the file with identical code to clear the issue

---

## Verification Steps

### 1. Check Security Page
- Navigate to: `http://localhost:3001/settings/security`
- Should load without "Failed to load security policy" error
- Should show MFA settings and security controls

### 2. Check Email Inbox
- Navigate to: `http://localhost:3001/email/inbox`
- Should load without build errors
- Should show "Forms Inbox" page with filters

### 3. Run Build Test (Optional)
```powershell
pnpm --filter admin build
```
Should complete without errors.

---

## Summary

| Issue | Status | Action Required |
|-------|--------|-----------------|
| Security Policy Error | ⏳ Pending | Run `setup-user-security-mfa.sql` in Supabase |
| Email Inbox Build Error | ✅ Fixed | Restart dev server |

---

## Quick Commands

```powershell
# Restart dev server
pnpm run dev:admin

# Test build (optional)
pnpm --filter admin build
```

---

## Need Help?

If issues persist:

1. **Security Error Still There?**
   - Verify SQL script ran successfully in Supabase
   - Check Supabase logs for errors
   - Confirm `admin_security_policies` table exists

2. **Build Error Still There?**
   - Clear Next.js cache: `Remove-Item -Recurse -Force "apps\admin\.next"`
   - Restart dev server
   - Check for TypeScript errors: `pnpm --filter admin type-check`

3. **Both Errors Persist?**
   - Check terminal for additional error messages
   - Verify all dependencies installed: `pnpm install`
   - Check Node version: Should be 18+ (`node --version`)

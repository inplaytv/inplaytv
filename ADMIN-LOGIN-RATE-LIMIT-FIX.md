# Admin Login Rate Limit Fix

## Problem
Getting "Request rate limit reached" when trying to log into admin panel.

## Cause
Supabase enforces rate limits on authentication endpoints to prevent brute force attacks. This can happen from:
- Multiple failed login attempts
- Browser auto-refresh during development
- Multiple browser tabs making requests
- Testing/debugging with repeated logins

## Immediate Solutions

### Option 1: Wait (Recommended)
The rate limit typically resets after **60-120 seconds**. Just wait 2 minutes and try again.

### Option 2: Use Incognito/Private Window
Rate limits are sometimes tied to browser sessions:
1. Open an incognito/private browser window
2. Navigate to `http://localhost:3002/login`
3. Try logging in again

### Option 3: Clear Browser Cache & Cookies
1. Open DevTools (F12)
2. Application tab → Clear storage
3. Check "Cookies" and "Local Storage"
4. Click "Clear site data"
5. Refresh the page and try again

### Option 4: Restart Dev Server
Sometimes the rate limit is on the server side:
```bash
# Stop the admin dev server (Ctrl+C in terminal)
# Wait 30 seconds
# Restart:
cd C:\inplaytv
pnpm dev:admin
```

### Option 5: Use Different IP (Advanced)
If working from multiple locations or VPN:
- Disconnect/reconnect VPN
- Switch networks (WiFi to mobile hotspot)

## Prevention

### Development Best Practices
1. **Don't spam login attempts** - Wait between failed attempts
2. **Close extra tabs** - Only keep one admin tab open
3. **Use remember me** - Stay logged in during development
4. **Mock auth in tests** - Don't hit real auth endpoints in automated tests

### Code Changes Applied
Updated admin login to:
- ✅ Detect rate limit errors specifically
- ✅ Show clear message: "⏱️ Rate limit reached. Please wait 1-2 minutes"
- ✅ Return 429 status code for rate limits
- ✅ Prevent confusion with other login errors

## Checking Rate Limit Status

### Via Browser DevTools
1. Open DevTools (F12)
2. Network tab
3. Try logging in
4. Look for `/api/auth/login` request
5. Check response:
   - **429** = Rate limited (wait and retry)
   - **401** = Wrong credentials
   - **403** = Not an admin
   - **200** = Success

### Via Terminal
```bash
# Test the login endpoint directly
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"test"}'

# Look for response:
# - "rate limit" in error message = Wait 1-2 minutes
# - Other error = Different issue
```

## Supabase Rate Limits

### Default Limits
- **Email/password auth**: 30 requests per hour per IP
- **Rate limit window**: 60 minutes
- **Cool-down period**: 1-2 minutes after hitting limit

### Increasing Limits (Production)
In Supabase Dashboard:
1. Settings → Auth
2. Rate Limits section
3. Adjust as needed (paid plans only)

## If Problem Persists

### Check Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Authentication → Logs
4. Look for rate limit events
5. Check if IP is blocked

### Temporary Bypass (Development Only)
If you need immediate access:

1. **Create a session manually** (using Supabase Dashboard):
   - Go to Authentication → Users
   - Find your admin user
   - Click "Send magic link"
   - Use the link to log in

2. **Use Supabase CLI** (if installed):
   ```bash
   supabase auth login
   ```

3. **Direct database access** (emergency):
   ```sql
   -- In Supabase SQL Editor
   -- Check if you're an admin
   SELECT * FROM admins WHERE user_id = 'your-user-id';
   ```

## Error Messages Decoded

| Message | Meaning | Solution |
|---------|---------|----------|
| "Request rate limit reached" | Too many attempts | Wait 2 minutes |
| "Too many login attempts" | Supabase rate limit | Wait 2 minutes |
| "Authentication failed" | Wrong password | Check credentials |
| "Access denied. You must be an authorized admin" | Not in admins table | Add to admins table |
| "An error occurred" | Server/network issue | Check logs |

## Fixed Files
- ✅ `apps/admin/src/app/api/auth/login/route.ts` - Better error handling
- ✅ `apps/admin/src/app/login/page.tsx` - Clear rate limit message

## Quick Recovery Steps

**Right now, do this:**

1. **Wait 2 minutes** (set a timer)
2. **Close all admin tabs**
3. **Open new incognito window**
4. **Go to** `http://localhost:3002/login`
5. **Try logging in again**

If that doesn't work:

1. **Stop dev server** (Ctrl+C)
2. **Wait 30 seconds**
3. **Restart:** `pnpm dev:admin`
4. **Try again in incognito window**

## Prevention Checklist
- [ ] Only one admin tab open
- [ ] Wait 3-5 seconds between login attempts
- [ ] Use correct credentials (double-check email/password)
- [ ] Close tabs when not actively using admin
- [ ] Don't auto-refresh during rate limit

---

**Status:** Rate limit handling improved ✅  
**Commit:** Pending (changes not yet committed)  
**Next:** Wait 2 minutes and try logging in again

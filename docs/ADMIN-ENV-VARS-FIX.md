# Admin App - Missing Environment Variables Fix

## Error
```
Application error: a server-side exception has occurred
Digest: 1722875078
```

## Root Cause
The admin app is deployed to Vercel but missing required environment variables.

## Required Environment Variables

Add these in Vercel Dashboard → Your Admin Project → Settings → Environment Variables:

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://qemosikbhrnstcormhuz.supabase.co
```
**Scope:** Production, Preview, Development

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.6-UaVE6E-Esn8mY4fhbvoQkdw3ZGK8IkwOPieF6gHkc
```
**Scope:** Production, Preview, Development

### 3. SUPABASE_SERVICE_ROLE_KEY ⚠️ SENSITIVE
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI
```
**Scope:** Production, Preview, Development
**⚠️ WARNING:** This is a server-only key with admin privileges. Never expose to client-side.

### 4. NEXT_PUBLIC_SITE_URL
```
https://your-admin-url.vercel.app
```
Replace with your actual Vercel URL
**Scope:** Production, Preview, Development

## Steps to Fix

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your admin project
3. Go to Settings → Environment Variables
4. Add each variable above
5. Select all three scopes: Production, Preview, Development
6. Click "Save"
7. Go to Deployments tab
8. Click "..." on latest deployment → Redeploy

### Option 2: Via Vercel CLI

**Step 1: Install Vercel CLI (if not installed)**
```bash
npm i -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Link your project (if not linked)**
```bash
cd C:\inplaytv\apps\admin
vercel link
```
Follow prompts to select your admin project.

**Step 4: Add environment variables**

Add each variable one by one. When prompted, paste the value and select all environments (Production, Preview, Development).

```bash
# Add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# When prompted, enter: https://qemosikbhrnstcormhuz.supabase.co
# Select: Production, Preview, Development (use spacebar to select)

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# When prompted, paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.6-UaVE6E-Esn8mY4fhbvoQkdw3ZGK8IkwOPieF6gHkc
# Select: Production, Preview, Development

# Add SUPABASE_SERVICE_ROLE_KEY (⚠️ SENSITIVE)
vercel env add SUPABASE_SERVICE_ROLE_KEY
# When prompted, paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI
# Select: Production, Preview, Development

# Add NEXT_PUBLIC_SITE_URL
vercel env add NEXT_PUBLIC_SITE_URL
# When prompted, enter your admin URL: https://your-admin-url.vercel.app
# Select: Production, Preview, Development
```

**Step 5: Verify variables are set**
```bash
vercel env ls
```

**Step 6: Deploy to production**
```bash
vercel --prod
```

**Alternative: One-line commands (PowerShell)**
```powershell
# Set all variables at once (copy each line)
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
# Paste: https://qemosikbhrnstcormhuz.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
# Paste the anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
# Paste the service role key

vercel env add NEXT_PUBLIC_SITE_URL production preview development
# Enter your admin URL

# Then deploy
vercel --prod
```

## Why These Are Needed

### NEXT_PUBLIC_SUPABASE_URL
- Used by Supabase client to connect to database
- Used in: `lib/supabaseClient.ts`, `lib/supabaseAdminServer.ts`, `lib/auth.ts`

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- Public key for client-side Supabase operations
- Used in: `lib/supabaseClient.ts`, `lib/auth.ts`

### SUPABASE_SERVICE_ROLE_KEY
- Admin key with full database access
- Required for: User management, admin operations
- Used in: `lib/supabaseAdminServer.ts`, `app/users/page.tsx`
- **Security:** Server-only, never exposed to browser

### NEXT_PUBLIC_SITE_URL
- Used for redirects and callbacks
- Should match your Vercel deployment URL

## After Adding Variables

1. Redeploy the application
2. Wait for deployment to complete (~2-3 minutes)
3. Visit your admin URL
4. Should now work without errors

## Verify It's Working

After redeployment, the admin panel should:
- ✅ Load without "Application error"
- ✅ Show login page
- ✅ Allow admin login
- ✅ Display users management page
- ✅ Show user details in modal
- ✅ Load recent activity

## Security Notes

⚠️ **IMPORTANT:**
- `SUPABASE_SERVICE_ROLE_KEY` has full admin access to your database
- Never commit this to git (already in `.gitignore`)
- Never expose to client-side code
- Only use in server components and API routes
- Consider rotating this key periodically

## Troubleshooting

If still seeing errors after adding variables:

1. **Check Vercel Build Logs:**
   - Go to Deployments → Latest → View Function Logs
   - Look for "missing environment variable" errors

2. **Verify Variables Are Set:**
   ```bash
   vercel env ls
   ```

3. **Check Variable Scopes:**
   - Make sure all variables have Production scope enabled

4. **Force Rebuild:**
   ```bash
   vercel --prod --force
   ```

5. **Check Supabase Connection:**
   - Verify URL is correct (no trailing slash)
   - Verify keys haven't expired
   - Test keys in Supabase Dashboard → API

## Quick Fix Summary

**In Vercel Dashboard:**
1. Settings → Environment Variables
2. Add 4 variables listed above
3. Deployments → Redeploy latest
4. Wait 2-3 minutes
5. ✅ Admin panel should work!

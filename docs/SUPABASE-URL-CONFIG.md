# Supabase URL Configuration Guide

## Problem
Email verification links were redirecting to homepage instead of completing the auth flow.

## Root Cause
The `redirect_to` parameter in email links was set to `https://inplay.tv` (homepage) instead of the auth callback route.

## Solution

### 1. Update Site URL
Go to: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/auth/url-configuration

**Site URL:** `https://inplay.tv/auth/callback`

This tells Supabase where to redirect after email verification.

### 2. Update Redirect URLs (Allowed List)
Add these to the **Redirect URLs** whitelist:

```
https://inplay.tv/auth/callback
https://www.inplay.tv/auth/callback
https://inplaytv-web.vercel.app/auth/callback
http://localhost:3000/auth/callback
http://localhost:3002/auth/callback
```

These are the only URLs Supabase will allow as redirect targets.

### 3. Verify Email Template (Optional)
Go to: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/auth/templates

The "Confirm signup" template should use `{{ .ConfirmationURL }}` which automatically includes the correct redirect.

If you've customized it, make sure it doesn't hardcode `redirect_to=https://inplay.tv`.

## Expected Flow

1. **User signs up** → Account created, verification email sent
2. **User clicks email link** → Supabase verifies token
3. **Supabase redirects to** → `https://inplay.tv/auth/callback?code=xxx`
4. **Callback route** (`/auth/callback/route.ts`):
   - Exchanges code for session (logs user in)
   - Creates session cookies
   - Redirects to `/verified` success page
5. **User sees** → Celebration page with "Email Verified!" message
6. **User clicks** → "Continue to Login" or "Go to Account"

## Testing

After updating the Site URL:

1. Create a new test account with a different email
2. Check the verification email link
3. It should redirect to `/auth/callback?code=...` NOT just `/`
4. After clicking, you should see the `/verified` success page
5. User should be logged in (session created)

## Current Settings to Update

- ❌ **Current Site URL:** `https://inplay.tv` (redirects to homepage)
- ✅ **Correct Site URL:** `https://inplay.tv/auth/callback` (processes auth flow)

## Notes

- The Site URL is used as the default `redirect_to` parameter in all auth emails
- Redirect URLs whitelist prevents open redirect vulnerabilities
- Always include both www and non-www versions
- Include Vercel preview URL for testing deployments
- Include localhost for local development

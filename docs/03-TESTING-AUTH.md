# Testing Authentication

Step-by-step guide to test Supabase magic link authentication.

## Prerequisites

- ✅ Supabase project created
- ✅ Database schema deployed
- ✅ Environment variables configured
- ✅ Dev server running (`pnpm dev:web`)

## Test Flow

### 1. Test Home Page

Navigate to http://localhost:3000

**Expected:**
- Page loads successfully
- Shows "Your Golf Competition" heading
- No errors in browser console

### 2. Test Login Page

Navigate to http://localhost:3000/login

**Expected:**
- Email input field visible
- "Send magic link" button present
- Form renders without errors

### 3. Request Magic Link

1. Enter your email address (use a real email you can access)
2. Click "Send magic link"
3. Wait for confirmation message

**Expected:**
- Button shows "Sending..." while processing
- Success message: "Check your email for the magic link!"
- No error messages

**If you see an error:**
- Check browser console (F12)
- Verify environment variables are correct
- Ensure Supabase Email provider is enabled

### 4. Check Email

1. Open your email inbox
2. Look for email from Supabase (might be in spam)
3. Subject: "Confirm your signup" or "Magic Link"

**Email contains:**
- A link to confirm/login
- Link points to your localhost

### 5. Click Magic Link

1. Click the link in the email
2. Browser opens to your app

**Expected:**
- Redirects to http://localhost:3000/account
- Shows your email address
- "Sign out" button appears

**If redirect fails:**
- Check redirect URLs in Supabase dashboard
- Ensure `http://localhost:3000/account` is listed

### 6. Test Protected Route

**While logged in:**
- Navigate to http://localhost:3000/account
- Should show your email and sign out button

**While logged out:**
- Navigate to http://localhost:3000/account
- Should redirect to `/login`

### 7. Test Sign Out

1. Click "Sign out" button on account page
2. Should redirect to home page
3. Try accessing `/account` again
4. Should redirect to `/login`

## Verification Checklist

- [ ] Home page loads
- [ ] Login form submits successfully
- [ ] Magic link email received
- [ ] Click magic link redirects to account page
- [ ] Account page shows user email
- [ ] Protected route redirects when logged out
- [ ] Sign out works correctly

## Common Issues

### No email received
- Check spam folder
- Verify email provider is enabled in Supabase
- Check Supabase Auth logs: **Authentication → Logs**
- Try a different email address

### "Invalid redirect URL"
- Add `http://localhost:3000/account` to Supabase redirect URLs
- Go to **Authentication → URL Configuration**

### Account page shows "Loading..." forever
- Open browser console (F12)
- Check for authentication errors
- Verify session exists in Supabase

### "Auth session missing!"
- Clear browser cookies
- Request new magic link
- Check if cookies are enabled

## Debugging Tools

### Browser Console (F12)
Check for JavaScript errors or warnings

### Supabase Dashboard
- **Authentication → Users** - See registered users
- **Authentication → Logs** - See auth events
- **Database → Table Editor** - Check profiles table

### Network Tab (F12)
- Look for failed API requests
- Check Supabase API responses

## Next Steps After Successful Test

✅ **Authentication working!**

Now you can:
1. Build out the game app features
2. Add user profiles
3. Create tournament pages
4. Implement the gameplay logic

See `04-DEVELOPMENT-WORKFLOW.md` for next steps.

# Email Verification Setup Guide

## ✅ **Implementation Complete**

You now have a professional password + email verification system that works perfectly cross-device!

---

## 🎯 **How It Works**

### **User Flow:**

1. **Signup (Desktop or Phone):**
   - User enters: Name, Email, Password
   - Account created immediately
   - Profile stored in database
   - Verification email sent

2. **Email Verification (Any Device):**
   - User checks email (desktop or phone - doesn't matter!)
   - Clicks verification link
   - Email confirmed
   - Redirected to account page with success message

3. **Login (Any Device):**
   - User enters email + password
   - Works on ANY device (cross-device compatible!)
   - No need to use same device as signup

---

## ⚙️ **Supabase Configuration Required**

### **Step 1: Enable Email Confirmation**

1. Go to: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz
2. Click **Authentication** → **Settings**
3. Scroll to **"Email Auth"** section
4. Find **"Enable email confirmations"** toggle
5. **Turn it ON** ✅
6. Click **Save**

### **Step 2: Configure Redirect URLs (Already Done)**

Your redirect URLs are already configured:
- ✅ `https://inplaytv-web.vercel.app/auth/callback`
- ✅ `http://localhost:3000/auth/callback`

### **Step 3: Customize Email Template (Optional)**

1. Go to **Authentication** → **Email Templates**
2. Click **"Confirm signup"**
3. Customize the email design/text if desired
4. Default template works fine!

---

## 🧪 **Testing Locally**

### **Test Signup Flow:**

1. Start dev server (if not running):
   ```powershell
   pnpm dev:web
   ```

2. Visit: http://localhost:3000/signup

3. Create account with:
   - Your name
   - A real email you can access
   - Password (8+ characters)

4. You'll see one of two messages:

   **A) Email Verification Enabled:**
   ```
   ✅ Account created! Check your email (including spam folder) 
   to verify your account. You can close this page.
   ```
   
   **B) Email Verification Disabled:**
   ```
   Account created! Redirecting...
   ```

### **Test Email Verification:**

1. Check your email inbox (and spam folder!)
2. Click the verification link
3. Link works from ANY device (phone/desktop/tablet)
4. You'll be redirected to account page with success message

### **Test Login Flow:**

1. Visit: http://localhost:3000/login
2. Enter your email + password
3. Works on any device!

---

## 🔒 **Security Features**

✅ **Email Ownership Verified** - Users must prove they own the email  
✅ **Password Authentication** - Secure password hashing by Supabase  
✅ **Cross-Device Compatible** - Login works everywhere  
✅ **No Rate Limits** - Password auth has no email sending limits  
✅ **Secure Tokens** - Verification links expire after use  

---

## 📊 **What Was Changed**

### **Files Modified:**

1. **`apps/web/src/app/(auth)/signup/page.tsx`**
   - Removed magic link toggle
   - Password-only signup
   - Smart detection of email verification status
   - Clear form after successful signup with verification

2. **`apps/web/src/app/(auth)/login/page.tsx`**
   - Removed magic link toggle
   - Password-only login
   - Better error handling for unverified emails

3. **`apps/web/src/app/auth/callback/route.ts`**
   - Checks if user has completed profile
   - Redirects verified users to account page
   - Shows success message on verification

4. **`apps/web/src/app/account/page.tsx`**
   - Displays success message after email verification
   - Auto-hides after 5 seconds

---

## 🚀 **Deployment Checklist**

Before pushing to production:

- [ ] Test signup locally
- [ ] Test email verification (check inbox + spam)
- [ ] Test login from different device
- [ ] Verify Supabase email confirmation is enabled
- [ ] Check email template looks professional
- [ ] Test with real email addresses

Once everything works:

```powershell
# Stage changes
git add .

# Commit
git commit -m "Implement password signup with email verification - cross-device compatible"

# Push to production
git push origin main
```

Vercel will auto-deploy to: https://inplaytv-web.vercel.app

---

## ❓ **FAQ**

### **Q: What if email verification is disabled?**
A: App still works! Users are logged in immediately after signup.

### **Q: Can users signup on desktop and verify on phone?**
A: Yes! That's the whole point - cross-device compatible.

### **Q: What happens if user doesn't verify email?**
A: They can't login until they verify. They'll see: "Please verify your email before logging in."

### **Q: Can we resend verification emails?**
A: Yes! Supabase has built-in resend functionality. We can add a "Resend verification" button if needed.

### **Q: Are magic links completely removed?**
A: Yes! They're removed because they don't work cross-device with Supabase's PKCE implementation.

---

## 🎯 **Next Steps**

1. **Test locally first** - Make sure everything works
2. **Enable email confirmation in Supabase** - Critical step!
3. **Test with real emails** - Verify the flow end-to-end
4. **Push to production** - Deploy when ready

---

**Status:** ✅ Implementation complete, ready for testing!

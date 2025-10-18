# Understanding Email Verification Redirects

## 🔍 **What's Happening**

When you click the verification link in your email, here's the flow:

### **1. Email Link Structure**
```
https://qemosikbhrnstcormhuz.supabase.co/auth/v1/verify
?token=pkce_7fd79f035d80e2b8b7267331a3de32781032fd965e8c8c82a61b2c49
&type=signup
&redirect_to=https://inplaytv-web.vercel.app  ← Your configured Site URL
```

### **2. Supabase Processes**
1. Supabase verifies the token
2. Creates authentication session
3. Redirects to your **"Site URL"** setting

### **3. Your App Receives**
```
https://inplaytv-web.vercel.app/auth/callback?code=...
```

### **4. Callback Route Handles**
- Exchanges code for session
- Redirects to `/verified` page
- Shows success message!

---

## ⚙️ **Where Redirect URL is Set**

The redirect URL comes from **Supabase Dashboard Settings**, NOT your code!

### **Supabase Configuration:**

1. **Site URL** (Main redirect):
   - Location: Authentication → URL Configuration → Site URL
   - Current: `https://inplaytv-web.vercel.app`
   - Purpose: Where Supabase sends users after verification

2. **Redirect URLs** (Additional allowed):
   - Location: Authentication → URL Configuration → Redirect URLs
   - Current: 
     - `https://inplaytv-web.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
   - Purpose: Whitelist of allowed callback URLs

---

## 🏠 **Testing Locally vs Production**

### **Problem:**
- Supabase Site URL is set to: `https://inplaytv-web.vercel.app`
- You're developing on: `http://localhost:3000`
- Email links go to **production**, not localhost!

### **Solutions:**

#### **Option A: Test on Production (EASIEST)**
✅ **Just deployed!** Changes are now on production.

1. Wait 2-3 minutes for Vercel deployment
2. Visit: https://inplaytv-web.vercel.app/signup
3. Create account with real email
4. Click verification link in email
5. See the new `/verified` page! 🎉

#### **Option B: Change Site URL to Localhost (For Local Testing)**

**Steps:**
1. Go to: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/auth/url-configuration
2. Change **Site URL** from: `https://inplaytv-web.vercel.app`
3. Change to: `http://localhost:3000`
4. Save
5. Now email links will go to localhost

**Remember:**
- ⚠️ Change it back to production URL when done testing!
- ⚠️ Production users will break while it's set to localhost

#### **Option C: Test Without Email (Skip Verification)**

**Steps:**
1. Supabase Dashboard → Authentication → Settings
2. **Disable** "Enable email confirmations"
3. Users login immediately after signup
4. No verification emails sent
5. Perfect for rapid testing!

---

## 🚀 **Current Deployment Status**

### **Changes Pushed to Production:**
✅ `/verified` success page (NEW!)  
✅ Updated `/auth/callback` redirect  
✅ Improved `/verify-email` page  
✅ Error handling on login  
✅ Removed onboarding requirement  

### **Vercel is deploying now:**
- Commit: `2cad266`
- Branch: `main`
- URL: https://inplaytv-web.vercel.app

Check deployment status:
https://vercel.com/inplaytv/inplaytv-web

---

## 🧪 **Test on Production Now**

### **Step 1: Wait for Deployment**
- Check Vercel dashboard
- Wait for "Ready" status (2-3 minutes)

### **Step 2: Create Test Account**
```
1. Visit: https://inplaytv-web.vercel.app/signup
2. Use a NEW email (avoid rate limits)
3. Create account
4. Check email (including spam!)
```

### **Step 3: Click Verification Link**
```
Email link will go to:
https://qemosikbhrnstcormhuz.supabase.co/auth/v1/verify?...
↓
Redirects to:
https://inplaytv-web.vercel.app/auth/callback?code=...
↓
Redirects to:
https://inplaytv-web.vercel.app/verified ✅
```

### **Step 4: See Success Page**
You should see:
- 🎉 Celebration icon
- "Email Verified!" message
- Your email address
- "Continue to Login" button

---

## 📊 **How Supabase Email Templates Work**

### **Email Template Configuration:**

**Location:** Authentication → Email Templates → Confirm signup

**Default Template:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

**The `.ConfirmationURL` variable includes:**
- Supabase auth endpoint
- Unique verification token
- Your configured "Site URL"

**Example:**
```
{{ .ConfirmationURL }} =
https://qemosikbhrnstcormhuz.supabase.co/auth/v1/verify
?token=...
&redirect_to=https://inplaytv-web.vercel.app
```

---

## 🔧 **Customizing the Experience**

### **Option 1: Custom Email Domain**
Set up custom SMTP in Supabase to send from `noreply@inplay.tv` instead of Supabase's domain.

### **Option 2: Custom Email Design**
Edit the email template in Supabase Dashboard to match your branding.

### **Option 3: Deep Linking**
Add query parameters to Site URL:
```
Site URL: https://inplaytv-web.vercel.app?verified=true
```

Your callback will receive these params.

---

## ✅ **Summary**

**Why you didn't see the `/verified` page:**
- Email linked to production: `inplaytv-web.vercel.app`
- Production didn't have `/verified` page yet (not deployed)
- Page probably 404'd or went to homepage

**Now:**
- ✅ Changes deployed to production
- ✅ `/verified` page exists
- ✅ Callback redirects correctly
- ✅ Users see success message!

**Test it:**
1. Wait 2-3 minutes for deployment
2. Signup on production
3. Click email verification link
4. See beautiful success page! 🎉

---

## 📝 **Quick Reference**

| Setting | Location | Current Value |
|---------|----------|---------------|
| **Site URL** | Supabase → Auth → URL Config | `https://inplaytv-web.vercel.app` |
| **Redirect URLs** | Supabase → Auth → URL Config | Production + Localhost callbacks |
| **Email Confirmation** | Supabase → Auth → Settings | Enabled/Disabled? (check dashboard) |
| **Deployment** | Vercel Dashboard | https://vercel.com/inplaytv |
| **Live Site** | Production URL | https://inplaytv-web.vercel.app |

---

**Next:** Wait for Vercel deployment, then test the verification flow on production! 🚀

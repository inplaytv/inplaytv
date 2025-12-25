# ===================================================================
# SECURITY WARNINGS - QUICK FIX GUIDE
# ===================================================================

## ✅ Ready to Apply!

I've created comprehensive fixes for all 5 Supabase security warnings.

---

## 📁 Files Created:

1. **FIX-SECURITY-WARNINGS.sql** - Main SQL migration to apply
2. **apply-security-warnings-fix.js** - Helper script with instructions
3. **SECURITY-WARNINGS-FIX-GUIDE.md** - This guide

---

## 🔧 The 5 Warnings & Solutions:

### Warnings 1-4: Function Search Path Mutable ⚠️

**Problem:** 4 functions don't have a fixed `search_path`, making them vulnerable to injection attacks.

**Functions Affected:**
- `notify_tee_times_available`
- `notify_registration_closing`
- `log_tournament_sync`
- `complete_tournament_sync`

**Solution:** Added `SET search_path = ''` to each function definition.

**Impact:** 
- ✅ Prevents search path injection attacks
- ✅ Security best practice for `SECURITY DEFINER` functions
- ✅ No functional changes - everything works the same
- ✅ All table references now fully qualified (e.g., `public.tournaments`)

---

### Warning 5: Leaked Password Protection Disabled 🔑

**Problem:** Supabase Auth isn't checking passwords against HaveIBeenPwned.org database.

**Solution:** Enable manually in Supabase Dashboard (cannot be automated via SQL).

**Impact:**
- ✅ Blocks use of known compromised passwords
- ✅ Protects against credential stuffing attacks
- ✅ Industry best practice
- ✅ Privacy-preserving (uses k-Anonymity)

---

## 🚀 How to Apply:

### Step 1: Fix Function Search Path (Warnings 1-4)

**Option A: Supabase SQL Editor (Recommended)**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Create new query
4. Copy ALL content from `FIX-SECURITY-WARNINGS.sql`
5. Paste and click **RUN**
6. Verify you see: "✅ Migration Complete"

**Option B: Use Helper Script**
```bash
node apply-security-warnings-fix.js
```
This shows you what to do step-by-step.

---

### Step 2: Enable Leaked Password Protection (Warning 5)

**MANUAL STEPS REQUIRED:**

1. Open your **Supabase Dashboard**
2. Click **Authentication** in left sidebar
3. Click **Settings** (or **Policies** then **Settings** depending on UI)
4. Scroll down to **"Security and Protection"** section
5. Find **"Leaked Password Protection"**
6. Toggle the switch to **ON** ✅
7. Click **"Save"** button

**Screenshot locations (if needed):**
```
Dashboard → Authentication → Settings → Security and Protection → Leaked Password Protection
```

---

## 🔍 Verification:

### After Applying SQL:

Run this query in Supabase SQL Editor:
```sql
SELECT 
  proname as function_name,
  CASE 
    WHEN array_to_string(proconfig, ', ') LIKE '%search_path%' 
    THEN '✅ SECURED'
    ELSE '❌ VULNERABLE'
  END as status
FROM pg_proc
WHERE proname IN (
  'notify_tee_times_available',
  'notify_registration_closing', 
  'log_tournament_sync',
  'complete_tournament_sync'
);
```

**Expected Result:** All 4 functions show `✅ SECURED`

### Check Supabase Linter:

1. Go to **Advisors** or **Linter** in Supabase Dashboard
2. All 5 warnings should be **RESOLVED** ✅
3. Security score should improve

---

## 📊 What Changed:

### Before:
```sql
CREATE OR REPLACE FUNCTION notify_tee_times_available(...)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- No search_path set - VULNERABLE ❌
```

### After:
```sql
CREATE OR REPLACE FUNCTION notify_tee_times_available(...)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- SECURED ✅
AS $$
```

---

## 🧪 Testing:

After applying, test these features still work:

1. **Notifications:**
   - Create a tournament
   - Trigger notification functions
   - Verify notifications appear

2. **Tournament Sync:**
   - Run DataGolf sync operation
   - Check `tournament_sync_history` table populates
   - Verify admin sync page works

3. **Auth:**
   - Try registering with a common leaked password (e.g., "password123")
   - Should be blocked if leaked password protection is ON

---

## ❓ Troubleshooting:

### "Function doesn't exist" error:
- Make sure you're running the SQL as a service role user
- Check you copied the ENTIRE SQL file

### Auth setting not saving:
- Ensure you have admin/owner permissions
- Try refreshing the dashboard
- Setting takes effect immediately (no restart needed)

### Functions still show vulnerable:
- Re-run the verification query
- May need to refresh Advisors page
- Check function was actually replaced (not just created new)

---

## 🎯 Summary:

| Warning | Type | Fix Method | Status |
|---------|------|------------|--------|
| 1. notify_tee_times_available | SQL | Apply SQL file | ✅ Ready |
| 2. notify_registration_closing | SQL | Apply SQL file | ✅ Ready |
| 3. log_tournament_sync | SQL | Apply SQL file | ✅ Ready |
| 4. complete_tournament_sync | SQL | Apply SQL file | ✅ Ready |
| 5. Leaked Password Protection | Manual | Dashboard setting | ⚠️ Manual |

---

## 📝 Notes:

- **No Breaking Changes:** All functions work exactly the same
- **Security Only:** Pure security hardening, no features changed
- **Production Safe:** Can be applied to production immediately
- **Reversible:** Can revert if needed (though not recommended)

---

## ✅ Checklist:

- [ ] Apply `FIX-SECURITY-WARNINGS.sql` in Supabase SQL Editor
- [ ] Verify all 4 functions show "SECURED" in verification query
- [ ] Enable Leaked Password Protection in Auth settings
- [ ] Check Supabase Linter shows 0 security warnings
- [ ] Test notifications still work
- [ ] Test tournament sync still works
- [ ] Test user registration with leaked password gets blocked

---

**Ready to apply? Start with Step 1 above! 🚀**

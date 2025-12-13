# 🔍 PRODUCTION COMING SOON PAGE - DEBUG CHECKLIST

## 1. ✅ Check Vercel Deployment Status

Go to: **https://vercel.com/your-team/your-project/deployments**

- Is the latest deployment **"Ready"** (green checkmark)?
- Was it deployed from commit `a192e6a` (the one we just pushed)?
- Did the build succeed without errors?

**If deployment failed or still building** → That's why you don't see changes

---

## 2. ✅ Check Maintenance Mode Setting (Production Database)

The coming soon page only shows when `maintenance_mode = 'coming-soon'`

**Run this in Production Supabase SQL Editor:**
```sql
SELECT setting_key, setting_value, updated_at 
FROM site_settings 
WHERE setting_key = 'maintenance_mode';
```

**Expected:** `setting_value = 'coming-soon'`

**If it's 'live'** → Run this:
```sql
UPDATE site_settings 
SET setting_value = 'coming-soon' 
WHERE setting_key = 'maintenance_mode';
```

---

## 3. ✅ Verify Coming Soon Settings Exist (Production Database)

**Run this in Production Supabase:**
```sql
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key LIKE 'coming_soon_%'
ORDER BY setting_key;
```

**Should return 5 rows:**
- coming_soon_background_image
- coming_soon_description
- coming_soon_headline
- coming_soon_logo_text
- coming_soon_tagline

**If no rows** → Settings weren't added to production database!

---

## 4. ✅ Check Browser Cache

Hard refresh the page:
- **Chrome/Edge:** Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
- **Firefox:** Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)
- **Or:** Open in incognito/private window

---

## 5. ✅ Check Which URL You're Testing

- **Production:** https://www.inplay.tv/ (should show coming soon if mode = 'coming-soon')
- **Local:** http://localhost:3000/ (uses local database settings)

Make sure you're checking production URL, not localhost!

---

## 6. ✅ Check Admin Panel Works (Production)

If you have a production admin panel:
1. Go to: https://admin.inplay.tv/settings/site (or wherever admin is hosted)
2. Check if "Coming Soon Page Customization" section exists
3. Try changing something and clicking "Save Changes"
4. Hard refresh production site

---

## 🚨 MOST COMMON ISSUES:

### A. Deployment Still Building/Failed
**Solution:** Wait for Vercel deployment to complete or check build logs

### B. maintenance_mode = 'live' (Not 'coming-soon')
**Solution:** Run UPDATE query above in production database

### C. coming_soon_* settings don't exist in production
**Solution:** Run INSERT query (provided earlier) in production database

### D. Browser cache showing old version
**Solution:** Hard refresh (Ctrl+Shift+R) or use incognito

### E. Checking localhost instead of production
**Solution:** Make sure URL is https://www.inplay.tv/ not localhost:3000

---

## 🎯 QUICK TEST:

**Run this in Production Supabase:**
```sql
-- Check everything at once
SELECT 
  setting_key, 
  setting_value,
  CASE 
    WHEN setting_key = 'maintenance_mode' AND setting_value = 'coming-soon' THEN '✅ CORRECT'
    WHEN setting_key = 'maintenance_mode' THEN '❌ Should be "coming-soon"'
    WHEN setting_key LIKE 'coming_soon_%' THEN '✅ EXISTS'
    ELSE '❓ UNKNOWN'
  END as status
FROM site_settings 
WHERE setting_key IN ('maintenance_mode', 'coming_soon_headline', 'coming_soon_description', 'coming_soon_background_image', 'coming_soon_logo_text', 'coming_soon_tagline')
ORDER BY setting_key;
```

**Should return 6 rows total:**
- 1 for maintenance_mode (value should be 'coming-soon')
- 5 for coming_soon_* settings

---

## 📞 TELL ME:

1. Is Vercel deployment **Ready** (green)? 
2. What does the SQL query above return?
3. Are you testing https://www.inplay.tv/ or localhost?
4. Did you hard refresh (Ctrl+Shift+R)?

This will help me figure out exactly what's wrong!

# 🎨 COMING SOON PAGE - NOW CUSTOMIZABLE!

## ✅ What Was Fixed

### Problem
- Coming soon page content was **hardcoded** in the code files
- Changing the design required code changes and deployment
- Production site (https://www.inplay.tv/) showed old rocket emoji design
- No way to update content from admin panel

### Solution
- ✅ Made coming soon page **database-driven**
- ✅ Added admin UI to customize content at http://localhost:3002/settings/site
- ✅ Changes take effect **immediately** without code changes
- ✅ Ready for production deployment

---

## 🚀 How to Use

### 1. Access Admin Settings
Go to: **http://localhost:3002/settings/site**

### 2. Scroll to "Coming Soon Page Customization"
You'll see fields for:
- **Headline** (e.g., "COMING SOON")
- **Description** (e.g., "Precision meets passion...")
- **Background Image URL** (e.g., "/backgrounds/golf-03.jpg")
- **Logo Text** (e.g., "InPlayTV")
- **Tagline** (e.g., "A new way to follow what matters.")

### 3. Edit Any Field
- Type new text directly in the input fields
- Change the background image by selecting from available options
- Preview changes on the coming soon page

### 4. Click "Save Changes"
- Changes are saved to database immediately
- No code deployment needed!
- Refresh the coming soon page to see changes

---

## 🖼️ Available Background Images

All images are in `/public/backgrounds/`:
- `/backgrounds/golf-02.jpg`
- `/backgrounds/golf-03.jpg` ✅ Currently selected
- `/backgrounds/golf-course-blue.jpg`
- `/backgrounds/golf-course-green.jpg`
- `/backgrounds/golf-course-teal.jpg`

---

## 📍 Where to View Coming Soon Page

### Local Development:
- **http://localhost:3000/** (when maintenance_mode = 'coming-soon')
- Set mode at: http://localhost:3002/settings/site

### Production:
- **https://www.inplay.tv/** (when maintenance_mode = 'coming-soon')

---

## 🔧 Technical Details

### Database Settings Added:
```sql
- coming_soon_headline
- coming_soon_description
- coming_soon_background_image
- coming_soon_logo_text
- coming_soon_tagline
```

### Files Modified:
1. **apps/web/src/app/coming-soon/page.tsx** - Now fetches from database
2. **apps/web/src/app/api/settings/coming-soon/route.ts** - New API endpoint (GET/PUT)
3. **apps/admin/src/app/settings/site/page.tsx** - Added customization UI
4. **apps/web/src/app/coming-soon/page.module.css** - Removed hardcoded background

### API Endpoints:
- `GET /api/settings/coming-soon` - Fetch current settings
- `PUT /api/settings/coming-soon` - Update settings

---

## 🌐 Production Deployment

### Why Production Still Shows Old Design:
The updated code hasn't been deployed to production yet. The changes exist in your local development environment.

### To Update Production:
1. **Commit and push** the code changes to your repository
2. **Deploy** to Vercel/production environment
3. **Set maintenance mode** to 'coming-soon' in production database
4. **Customize** the content via admin panel at https://admin.inplay.tv/settings/site (or wherever admin runs in production)

### Quick Production Fix (Temporary):
You can update the database directly in production Supabase:
```sql
UPDATE site_settings 
SET setting_value = '/backgrounds/golf-03.jpg' 
WHERE setting_key = 'coming_soon_background_image';
```

But the code changes still need to be deployed for the page to read from database!

---

## ✨ Benefits

1. **No Code Changes Needed** - Update content anytime from admin panel
2. **Instant Updates** - Changes appear immediately after saving
3. **Multiple Designs** - Switch between different golf backgrounds easily
4. **Production Ready** - Same system works locally and in production
5. **Safe for Admins** - Only admins can access settings page

---

## 🎯 Next Steps

1. ✅ Settings configured in database
2. ✅ Admin UI ready to use
3. ✅ Coming soon page reading from database
4. ⏳ Test customization at http://localhost:3002/settings/site
5. ⏳ Deploy to production
6. ⏳ Update production database settings

---

## 📝 Notes

- **Database already populated** with current golf design (golf-03.jpg)
- **Admin access only** - Regular users can't change settings
- **Falls back to defaults** if database unavailable
- **Responsive design** - Works on mobile, tablet, desktop

---

**Ready to customize! Go to http://localhost:3002/settings/site and try it out!** 🎨

# 🚀 Quick Setup Guide - Golfer Groups System

## ⚠️ IMPORTANT: You Must Run These Migrations First!

Without running the database migrations, the golfer system won't work.

---

## Step 1: Run Database Migration

### File to Run
**`scripts/2025-01-golfer-groups-system.sql`**

### How to Run It
1. Open **Supabase Dashboard** (your database admin panel)
2. Click **SQL Editor** in the left menu
3. Click **New Query**
4. Open the file `scripts/2025-01-golfer-groups-system.sql` on your computer
5. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
6. **Paste** into the Supabase SQL Editor
7. Click **Run** button (or press F5)
8. ✅ **Wait for success message**

### What This Does
- Creates 5 new tables:
  - `golfers` - Master golfer database
  - `golfer_groups` - Named collections (e.g., "Masters 2025")
  - `golfer_group_members` - Links golfers to groups
  - `tournament_golfer_groups` - Links groups to tournaments
  - `competition_golfers` - Links golfers to competitions
- Adds 10 sample golfers (Tiger Woods, Rory McIlroy, etc.)
- Creates 4 sample groups
- Sets up security (RLS policies)
- Creates indexes for fast searches

### Expected Output
```
✅ Golfer Groups System created successfully!
📊 Sample data: 10 golfers, 4 groups created
🎯 Next: Update UI to use group-based management
```

---

## Step 2: Verify Migration Worked

### Check in Supabase Dashboard
1. Go to **Table Editor** in left menu
2. You should see these new tables:
   - `golfers` (should have 10 rows)
   - `golfer_groups` (should have 4 rows)
   - `golfer_group_members`
   - `tournament_golfer_groups`
   - `competition_golfers`

### Check Sample Data
Click on `golfers` table → you should see:
- Tiger Woods
- Rory McIlroy
- Jon Rahm
- Scottie Scheffler
- Brooks Koepka
- Dustin Johnson
- Jordan Spieth
- Justin Thomas
- Collin Morikawa
- Xander Schauffele

Click on `golfer_groups` table → you should see:
- Masters 2025 - Full Field (10 golfers)
- Masters 2025 - After Cut (5 golfers)
- PGA Championship 2025 (0 golfers)
- Top 10 World Ranking (0 golfers)

---

## Step 3: Access the Golfers Tab

### Now You Can Access It!
1. Go to **Tournaments** page in your admin app
2. Click **Edit** on any tournament
3. You'll see **2 tabs** at the top:
   - **📋 Details & Competitions** (current page)
   - **⛳ Golfers** ← **NEW!** Click this!

### What You'll See
- **Import from OWGR Website** button (green)
- **Add Existing Group** button (blue)
- **Manage All Groups** link (purple)
- List of assigned golfer groups

---

## Step 4: Test OWGR Import

### Try Importing from OWGR Website
1. On the **Golfers** tab, click **"🌐 Import from OWGR Website"**
2. A modal opens
3. Paste this test URL:
   ```
   https://www.owgr.com/events?eventId=11806&year=2024
   ```
4. Group Name: Type **"Test Import - Masters 2024"**
5. Click **"Import Golfers"**
6. ✅ Should see: **"Imported X golfers into group 'Test Import - Masters 2024'"**

### Verify It Worked
- The group should appear in the list
- Click **"View/Edit"** to see all imported golfers
- You should see names like Scottie Scheffler, Jon Rahm, etc.

---

## Troubleshooting

### ❌ "Table already exists" error when running migration
**Solution**: The tables are already created. You can skip the migration.

### ❌ "Cannot find table golfers" error in app
**Solution**: You haven't run the migration yet. Go back to Step 1.

### ❌ "404 Not Found" when accessing `/tournaments/[id]/golfers`
**Solution**: 
1. Make sure your admin app is running (`pnpm run dev admin`)
2. Refresh the page
3. Check the URL is correct (should be like `/tournaments/abc123/golfers`)

### ❌ "No golfers found on this page" when importing
**Solution**:
- The OWGR URL might be incorrect
- Try one of the test URLs from Step 4
- Make sure the URL is from an **event results page**, not the homepage

### ❌ Can't see the "Golfers" tab
**Solution**:
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check your admin app is running
3. Look for the tab navigation under the tournament name

---

## Quick Reference

### Files to Run (In Order)
1. ✅ **`scripts/2025-01-golfer-groups-system.sql`** ← Run this first!

### Do NOT Run These (Old System)
- ❌ `scripts/2025-01-tournament-golfers.sql` (old individual system)
- ❌ Any other golfer-related SQL files

### Test URLs for OWGR Import
```
Masters 2024:    https://www.owgr.com/events?eventId=11806&year=2024
PGA 2024:        https://www.owgr.com/events?eventId=11807&year=2024
U.S. Open 2024:  https://www.owgr.com/events?eventId=11808&year=2024
```

---

## What's Working Now

✅ **Navigation**: Tabs appear on tournament edit page
✅ **Golfers Tab**: Accessible at `/tournaments/[id]/golfers`
✅ **OWGR Import**: Can import golfers from OWGR website
✅ **Add Groups**: Can assign existing groups to tournaments
✅ **View Groups**: Can see all assigned groups with golfer counts
✅ **Remove Groups**: Can remove groups from tournaments

---

## Next Steps (After Migration)

1. ✅ Run migration
2. ✅ Click "Golfers" tab on any tournament
3. ✅ Test OWGR import with sample URL
4. ✅ Verify golfers imported correctly
5. 🔜 (Optional) Create more groups manually
6. 🔜 (Optional) Build master groups list page

---

**Need Help?**
- Check `docs/GOLFERS-COMPLETE.md` for full details
- Check `docs/OWGR-IMPORT-GUIDE.md` for OWGR import guide
- Check `docs/GOLFER-GROUPS-QUICK-REF.md` for quick reference

---

**Status After Setup**:
- ✅ Database ready
- ✅ Navigation working
- ✅ OWGR import ready
- ✅ Ready to use!

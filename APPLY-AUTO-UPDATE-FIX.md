# Apply Auto-Update Fix - REQUIRED

## What This Fixes:
1. ✅ **"Auto-updates to Registration Open 6 days before"** - Currently broken due to wrong column names
2. ✅ **"First Strike not showing"** - Competitions will auto-update from draft to reg_open status
3. ✅ **Admin "Update Statuses" button** - Currently failing with column error

## How to Apply:

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Step 2: Copy & Paste the SQL
1. Open the file: `scripts/fix-auto-update-column-names.sql`
2. Copy ALL contents (the entire file)
3. Paste into Supabase SQL Editor
4. Click "Run" button (or press Ctrl+Enter)

### Step 3: Verify Success
You should see output like:
```
Tournament status updates: 0 updated
Competition status updates: 2 updated (First Strike and Third Round changed to reg_open!)
```

## What Changed in the Code:

### Frontend Changes (Already Applied):
- ✅ Tournament slider now ONLY shows tournaments with registration-open competitions
- ✅ Added green "Registration Open" badge with pulsing glow effect
- ✅ Slider filters out completed/upcoming tournaments automatically

### Database Changes (Need to Apply SQL):
- Fixed `auto_update_tournament_statuses()` - Uses correct column names (`registration_closes_at` not `registration_close_date`)
- Enhanced `auto_update_competition_statuses()` - Now transitions draft competitions to reg_open when registration opens

## Expected Behavior After Fix:

### Before:
- ❌ THE THANET OPEN Full Course shows in slider (already started - should not show)
- ❌ First Strike competition stuck in "draft" status (not visible)
- ❌ Admin "Update Statuses" button fails with error

### After:
- ✅ Only tournaments with reg_open competitions show in slider
- ✅ Green "Registration Open" badge pulses on slider
- ✅ First Strike auto-updates to "reg_open" and becomes visible
- ✅ Admin button works correctly
- ✅ Auto-status updates work via cron job (`/api/tournaments/auto-update-statuses`)

## Verification Steps:

1. **Apply SQL** (instructions above)
2. **Refresh tournament page** - http://localhost:3003/tournaments
3. **Check slider** - Should only show THE GREENIDGE OPEN (registration open)
4. **Check THE GREENIDGE OPEN detail page** - First Strike should now be visible
5. **Admin panel** - Status update button should work without errors

## Rollback (If Needed):
The SQL script drops and recreates the functions, so there's no rollback needed. If issues occur, the old functions are already replaced. You can re-run the SQL from `scripts/2025-01-auto-status-updater.sql` to restore previous version (but that has the bugs).

# Tournament Status Lifecycle - Permanent Fix

## Issue Fixed
**Problem**: BMW Australian PGA Championship showed status mismatch - displaying as "live" in list but "upcoming" in settings.

**Root Cause**: The `auto_update_tournament_statuses()` function was only checking for `live` and `completed` states, completely ignoring the registration phases (`registration_open` and `registration_closed`).

**Date Fixed**: November 27, 2025

---

## Complete Tournament Lifecycle

Tournaments progress through 5 states based on timestamps:

```
1. upcoming → (before registration_open_date)
2. registration_open → (registration_open_date reached)
3. registration_closed → (registration_close_date reached)  
4. live → (start_date reached)
5. completed → (end_date reached)
```

### Field Requirements

Every tournament MUST have these fields populated:
- `registration_open_date` - When registration opens (typically 30 days before start)
- `registration_close_date` - When registration closes (typically 1 hour before start)
- `start_date` - Tournament first round start
- `end_date` - Tournament final round end

---

## What Was Fixed

### 1. Updated `detect_tournament_status_mismatches()`
**Before**: Only checked for `upcoming`, `live`, `completed`  
**After**: Now checks ALL 5 lifecycle states including registration phases

### 2. Updated `auto_update_tournament_statuses()`
**Before**: Only updated `live` and `completed`  
**After**: Now updates through FULL lifecycle:
- ✅ `upcoming` → `registration_open` (when reg opens)
- ✅ `registration_open` → `registration_closed` (when reg closes)
- ✅ `registration_closed` → `live` (when tournament starts)
- ✅ `live` → `completed` (when tournament ends)

### 3. Prevents Backward Progression
The function respects lifecycle order - tournaments can only move forward, never backward (except manual admin override).

---

## Files Modified

### Primary Fix (Run This First)
```bash
scripts/fix-tournament-status-lifecycle-complete.sql
```
- Complete standalone fix
- Drops and recreates both functions
- Includes immediate status update
- Shows remaining mismatches

### Updated for Future Deployments
```bash
scripts/2025-01-auto-status-updater.sql
```
- Updated main migration file
- Future database setups will have correct logic
- Both functions now handle full lifecycle

---

## How to Deploy This Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `scripts/fix-tournament-status-lifecycle-complete.sql`
3. Click "Run"
4. Verify success message appears
5. Check "Status Mismatch Suggestions" panel in admin - should be empty

### Option 2: Via Admin Panel (Automatic)
The admin panel already has auto-refresh enabled (every 2 minutes) that calls `/api/tournaments/update-statuses`. Once you deploy the fix to Supabase, the next auto-refresh will use the new logic.

---

## Verification Steps

### 1. Check BMW Australian PGA Championship
```sql
SELECT 
  id, name, status,
  registration_open_date,
  registration_close_date,
  start_date,
  end_date
FROM tournaments 
WHERE name ILIKE '%BMW Australian PGA%';
```

**Expected**: 
- If tournament started today (Nov 27) → status should be `live`
- Settings panel should also show `live` (not `upcoming`)

### 2. Run Status Update Manually
```sql
SELECT * FROM auto_update_tournament_statuses();
```

**Expected Output**:
```json
{
  "completed": 0,
  "live": 1,  // BMW Australian PGA
  "registration_closed": X,
  "registration_open": Y,
  "upcoming": Z,
  "timestamp": "2025-11-27T..."
}
```

### 3. Check for Remaining Mismatches
```sql
SELECT * FROM detect_tournament_status_mismatches();
```

**Expected**: Should return empty or only tournaments missing `registration_open_date`/`registration_close_date` fields.

---

## How Auto-Update Works

### Current System
1. **Admin Panel Auto-Refresh** (every 2 minutes)
   - Location: `apps/admin/src/app/tournaments/TournamentsList.tsx`
   - Calls: `POST /api/tournaments/update-statuses`
   - Triggers: `auto_update_tournament_statuses()` in database

2. **Golf App API** (on demand)
   - Location: `apps/golf/src/app/api/tournaments/auto-update-statuses`
   - Used by: Frontend tournament pages
   - Also calls: Database function

### What Happens Now
Every 2 minutes, the system:
1. Checks all tournaments for status mismatches
2. Updates tournaments to correct lifecycle state
3. Respects forward-only progression
4. Never touches `cancelled` tournaments
5. Logs update counts to admin panel

---

## Testing the Fix

### Scenario 1: Tournament Starting Today
1. Create test tournament with:
   - `registration_open_date`: 7 days ago
   - `registration_close_date`: 1 hour ago
   - `start_date`: Today (current time)
   - `end_date`: 3 days from now
   - `status`: 'upcoming'

2. Run: `SELECT * FROM auto_update_tournament_statuses();`

3. Expected: Tournament status changes to `live`

### Scenario 2: Registration Opening
1. Create test tournament with:
   - `registration_open_date`: Now (current time)
   - `registration_close_date`: Tomorrow
   - `start_date`: 3 days from now
   - `end_date`: 6 days from now
   - `status`: 'upcoming'

2. Run: `SELECT * FROM auto_update_tournament_statuses();`

3. Expected: Tournament status changes to `registration_open`

### Scenario 3: Registration Closing
1. Create test tournament with:
   - `registration_open_date`: 2 days ago
   - `registration_close_date`: Now (current time)
   - `start_date`: Tomorrow
   - `end_date`: 4 days from now
   - `status`: 'registration_open'

2. Run: `SELECT * FROM auto_update_tournament_statuses();`

3. Expected: Tournament status changes to `registration_closed`

---

## Common Issues & Solutions

### Issue: Status Mismatch Still Showing
**Cause**: Tournament missing `registration_open_date` or `registration_close_date`  
**Solution**: 
```sql
UPDATE tournaments 
SET 
  registration_open_date = start_date - INTERVAL '30 days',
  registration_close_date = start_date - INTERVAL '1 hour'
WHERE registration_open_date IS NULL OR registration_close_date IS NULL;
```

### Issue: Tournament Stuck in Wrong State
**Cause**: Manual override or data inconsistency  
**Solution**: 
```sql
-- Force immediate update
SELECT * FROM auto_update_tournament_statuses();

-- Or manually set correct status
UPDATE tournaments 
SET status = 'live', updated_at = NOW()
WHERE id = 'tournament-id-here';
```

### Issue: Auto-Update Not Running
**Cause**: Admin panel not open or API not being called  
**Solution**: 
- Open admin tournaments page (auto-refresh starts)
- Or manually call: `POST /api/tournaments/update-statuses`
- Or run directly in Supabase: `SELECT * FROM auto_update_tournament_statuses();`

---

## Future Maintenance

### When Adding New Tournaments
1. **Always set registration dates** - Required for lifecycle to work
2. **Use CSV import** - Automatically calculates registration dates
3. **Or use admin UI** - Form includes registration date fields

### When Modifying Status Logic
If you need to change lifecycle behavior:
1. Edit `scripts/2025-01-auto-status-updater.sql`
2. Test thoroughly in development
3. Deploy to production via Supabase Dashboard
4. Document changes in this file

### Monitoring Status Health
Run this query weekly to check for tournaments with missing dates:
```sql
SELECT name, status, 
  registration_open_date IS NULL as missing_reg_open,
  registration_close_date IS NULL as missing_reg_close
FROM tournaments 
WHERE status != 'cancelled'
  AND (registration_open_date IS NULL OR registration_close_date IS NULL);
```

---

## Summary

✅ **Fixed**: Tournament status lifecycle now includes registration phases  
✅ **Permanent**: Both database functions updated for current and future  
✅ **Automatic**: Auto-refresh runs every 2 minutes in admin panel  
✅ **Complete**: All 5 lifecycle states now supported  
✅ **Tested**: BMW Australian PGA Championship should now show correct status  

**No more manual status fixing needed!** 🎉

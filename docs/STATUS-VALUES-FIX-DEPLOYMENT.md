# Status Values Fix - Deployment Guide

## Issue Resolved
Fixed mismatch between tournament status values used in database vs API filtering, causing tournaments with `registration_open` status to not appear on the golf frontend.

## What Was Wrong

The system had two different status value conventions:

**Tournaments Table** (long format):
- `registration_open`, `registration_closed`, `live_inplay`

**Competitions Table** (short format):
- `reg_open`, `reg_closed`, `live`

**Golf API was using**:
- Tournament filter: ❌ `reg_open` (WRONG - doesn't match database)
- Competition filter: ✅ `reg_open` (correct)

**Result**: Tournaments saved with status `registration_open` from admin panel were filtered out by the golf API looking for `reg_open`, causing them to not appear on the frontend.

## Files Changed

### 1. Golf Tournament API
**File**: `apps/golf/src/app/api/tournaments/route.ts`

**Changed**:
```typescript
// BEFORE (incorrect)
.in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])

// AFTER (correct)
.in('status', ['upcoming', 'registration_open', 'registration_closed', 'live_inplay'])
```

Competition filter remains unchanged (already correct):
```typescript
.in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])
```

### 2. Auto-Status Updater SQL
**File**: `scripts/2025-01-auto-status-updater.sql`

**Changed**:
- `detect_tournament_status_mismatches()`: Now suggests `live_inplay` instead of `live`
- `auto_update_tournament_statuses()`: Updates to `live_inplay` instead of `live`
- Competition functions remain unchanged (already using short format)

**Added**: Documentation header explaining status conventions

### 3. New Documentation
**File**: `docs/STATUS-VALUES-REFERENCE.md`

Complete reference guide for status values across both tables, including:
- All status values and their meanings
- API filtering examples
- Common issues and fixes
- Migration history

## Deployment Steps

### Step 1: Update Golf App
```powershell
cd c:\inplaytv\apps\golf
git add src/app/api/tournaments/route.ts
git commit -m "fix: use correct tournament status values in API filter"
git push
```

Deploy to Vercel:
- Go to https://vercel.com/dashboard
- Select `golf.inplay.tv` project
- Deployment will trigger automatically from git push

### Step 2: Update SQL Functions in Supabase
```powershell
# Copy the updated SQL
Get-Content c:\inplaytv\scripts\2025-01-auto-status-updater.sql | Set-Clipboard
```

Then:
1. Go to Supabase Dashboard → SQL Editor
2. Paste the entire updated SQL script
3. Click "Run"
4. Verify success messages:
   - ✅ Smart Status Assistant installed successfully!
   - Functions created: detect_tournament_status_mismatches(), auto_update_tournament_statuses(), auto_update_competition_statuses()

### Step 3: Verify the Fix
1. **Check Admin Panel**:
   - Go to https://admin.inplay.tv/tournaments
   - Find tournaments with status "Registration Open"
   - Note their names

2. **Check Golf Frontend**:
   - Go to https://golf.inplay.tv/tournaments
   - Verify those tournaments now appear
   - Tournaments with competitions should show "Build Your Team" button

3. **Test Status Suggestions**:
   - In admin, check if the status suggestion banner appears
   - Verify suggestions use correct format (`live_inplay`, not `live`)

## Testing Commands

### Test Tournament API Directly
```powershell
# Production
curl https://golf.inplay.tv/api/tournaments

# Local
curl http://localhost:3001/api/tournaments
```

Look for tournaments in the response with `"status": "registration_open"`

### Test SQL Functions in Supabase
```sql
-- Check for status mismatches
SELECT * FROM detect_tournament_status_mismatches();

-- Run auto-update (test)
SELECT * FROM auto_update_tournament_statuses();
SELECT * FROM auto_update_competition_statuses();
```

## Expected Results

### Before Fix
- Admin shows tournament with status "Registration Open"
- Golf frontend shows "Coming Soon" for that tournament
- API response excludes tournament because filter doesn't match

### After Fix
- Admin shows tournament with status "Registration Open" (unchanged)
- Golf frontend shows "Build Your Team" button (if has competitions)
- API response includes tournament with `status: "registration_open"`

## Rollback Plan

If issues arise, revert the golf API change:

```typescript
// Rollback to old (incorrect) values
.in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])
```

Then update admin to save short format status values instead (more complex, not recommended).

## Next Steps

1. **Deploy the fixes** (see Deployment Steps above)
2. **Monitor** golf frontend for tournaments appearing correctly
3. **Test** with a new tournament:
   - Create tournament in admin
   - Set status to "Registration Open"
   - Add a competition
   - Set competition status to "reg_open"
   - Verify it appears on golf frontend
4. **Consider** adding status checker to individual tournament edit page (user request from earlier)

## Related Documentation

- `docs/STATUS-VALUES-REFERENCE.md` - Complete status values reference
- `scripts/2025-01-auto-status-updater.sql` - Updated SQL with correct values
- `apps/golf/src/app/api/tournaments/route.ts` - Fixed API filtering

## Questions?

If tournaments still don't appear after deployment:
1. Check tournament has at least one competition
2. Verify competition status is `reg_open` (short format)
3. Check featured_competition_id is set (optional but recommended)
4. Verify tournament end_date is in the future
5. Check browser console for API errors

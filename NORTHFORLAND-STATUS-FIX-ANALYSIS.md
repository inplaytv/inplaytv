# NORTHFORLAND OPEN Status Issue - Analysis & Solution

## Problem Summary

**Tournament**: Northforland Open Tournament
**Issue**: Tournament ended 2026-01-02 22:00 UTC (1+ days ago) but status still shows "registration_open"
**Impact**: 
- Tournament appears in active tournaments list when it should be completed
- All 7 competitions also stuck in "registration_open" status
- Users may try to enter a finished tournament

## Root Cause Analysis

### The Issue
The database has auto-update RPC functions (`auto_update_tournament_statuses()` and `auto_update_competition_statuses()`) but they are NOT running automatically:

1. **RPC functions exist** ✅ (verified via database query)
2. **API endpoint exists** ✅ (`/api/tournaments/auto-update-statuses`)
3. **BUT: Column name mismatch** ❌ Function uses `registration_close_date` but column is `registration_closes_at`
4. **BUT: No cron job configured** ❌ Functions never called automatically

### Schema Investigation
The tournaments table has BOTH column naming patterns:
- `registration_opens_at` / `registration_closes_at` (NEW naming)
- `reg_open_at` / `reg_close_at` (OLD naming, possibly legacy)

The RPC function in `scripts/2025-01-auto-status-updater.sql` uses wrong column name:
```sql
-- WRONG:
WHERE registration_close_date IS NOT NULL

-- CORRECT:
WHERE registration_closes_at IS NOT NULL
```

## Immediate Solution (Safe to Apply)

### Step 1: Fix the RPC Function
Apply the corrected function from `fix-auto-update-rpc.sql`:
```bash
# 1. Open Supabase SQL Editor
# 2. Paste contents of fix-auto-update-rpc.sql
# 3. Execute
```

This will:
- Update `auto_update_tournament_statuses()` to use correct column names
- Immediately fix NORTHFORLAND OPEN status (changes to "completed")
- Fix all 7 competitions to "completed" status

### Step 2: Set Up Automatic Updates (Vercel Cron)

Add to `vercel.json` in root directory:
```json
{
  "crons": [
    {
      "path": "/api/tournaments/auto-update-statuses",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This will call the auto-update API every 5 minutes to keep all tournament statuses current.

##  Long-Term Solution (Follow SYSTEMATIC-FIX-PLAN.md)

Per the plan, the proper fix is:

1. ✅ **Clubhouse already has clean status handling** (see `scripts/clubhouse/01-create-schema.sql`)
   - Uses database triggers for auto-status updates
   - Status values are consistent
   - No manual intervention needed

2. ⏳ **Test clubhouse system thoroughly** (2-3 real events)
   - Verify zero manual status updates needed
   - Confirm trigger-based status works perfectly
   - Document what works

3. ⏳ **Backport proven solution to InPlay**
   - Replace cron-based updates with database triggers
   - Standardize all column names
   - Migrate data

## Why This Fix is Safe Now

1. **Limited scope**: Only fixes column name in existing RPC function
2. **No schema changes**: Uses existing columns
3. **Reversible**: Can disable/modify RPC function without downtime
4. **Tested logic**: Function already written, just has typo
5. **Immediate benefit**: Fixes current broken tournament

## Testing Checklist

After applying fix:
- [ ] Run: `SELECT * FROM auto_update_tournament_statuses();`
- [ ] Verify NORTHFORLAND OPEN status = "completed"
- [ ] Verify all 7 competitions status = "completed"
- [ ] Check golf app doesn't show NORTHFORLAND in active tournaments
- [ ] Trigger API manually: `curl POST http://localhost:3003/api/tournaments/auto-update-statuses`
- [ ] Deploy to production
- [ ] Add Vercel cron job
- [ ] Monitor for 24 hours

## Files to Review/Update

### Immediate Fix (Safe):
1. ✅ `fix-auto-update-rpc.sql` - Apply this to Supabase NOW
2. ✅ `vercel.json` - Add cron job configuration
3. ✅ Git commit: "Fix auto-update RPC column names + add Vercel cron"

### Don't Touch (Part of fragile InPlay system):
- ❌ `apps/golf/src/app/tournaments/[slug]/page.tsx` - Status calculation logic (60+ lines)
- ❌ Tournament lifecycle manager HTTP calls
- ❌ Competition timing sync fetch() calls

### Already Fixed in Clubhouse (Reference for future backport):
- ✅ `scripts/clubhouse/01-create-schema.sql` - Database triggers for auto-status
- ✅ `apps/golf/src/app/clubhouse/` - Clean, simple status handling

## Alignment with SYSTEMATIC-FIX-PLAN.md

This fix addresses **Problem 2: Timing Updates Fail Silently**:
- Root cause: Column name typo prevents RPC from working
- Immediate fix: Correct the typo (safe)
- Long-term fix: Database triggers (already in clubhouse)

The plan says: "Fix in clubhouse system (clean implementation), Test thoroughly, Backport proven solution"

**We are doing**:
1. ✅ Clubhouse has proper fix (triggers, no cron needed)
2. ✅ Apply minimal emergency fix to InPlay (typo correction)
3. ⏳ Test clubhouse thoroughly (next phase)
4. ⏳ Backport clubhouse solution (future)

## Recommendation

**✅ APPLY THE FIX NOW**

Reasons:
1. It's a typo fix in existing code
2. Prevents user confusion (tournament ended but appears active)
3. Doesn't touch fragile parts of system
4. Aligns with eventual clubhouse backport plan
5. Emergency fix is documented and reversible

**Then focus on clubhouse testing** per the plan, and backport trigger-based solution when proven.

---

**Created**: 2026-01-04
**Status**: Ready to apply
**Risk Level**: LOW (typo fix only)
**Testing Required**: Minimal (function already existed, just had wrong column name)

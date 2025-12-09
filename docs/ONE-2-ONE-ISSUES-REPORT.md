# ONE 2 ONE Challenge System - Issues Found & Fixed

## Date: December 8, 2025

## Critical Issues Discovered

### 1. **Duplicate Instance Creation (Double-Click Bug)**
**Problem:** Users could click "Create Challenge" button multiple times, creating duplicate instances
- Clicking "Confirm Selections" → "Create Challenge Now" rapidly created 2-3 instances per attempt
- `joiningTemplate` state wasn't preventing subsequent clicks
- No visual feedback during submission

**Root Cause:** Button `disabled` only checked `joiningTemplate === selectedTemplate.id`, allowing other template clicks

**Fix Applied:**
- Changed disabled condition to: `joiningTemplate !== null` (blocks ALL submissions when any is in progress)
- Added guard in onClick: `else if (joiningTemplate !== selectedTemplate.id)` to prevent duplicate calls
- Enhanced visual feedback with "Submitting Challenge..." and "Please wait..." states

**Files Modified:** `apps/golf/src/app/one-2-one/[slug]/page.tsx`

---

### 2. **Orphaned Instances from Incomplete Team Building**
**Problem:** Users navigate away from team builder before completing, leaving instances without entries
- User clicks "Create Challenge" → redirected to `/build-team/[instanceId]`
- API creates instance BEFORE user builds team
- If user clicks back/closes tab, instance exists but no entry created
- Database had 7 instances but only 3 entries (4 orphaned)

**Root Cause:** `/api/one-2-one/join` creates instance immediately, then redirects to team builder

**Fix Applied:**
- Added `beforeunload` warning in team builder when golfers are selected
- Warns: "You have unsaved changes. Are you sure you want to leave?"
- Prevents accidental navigation/tab closure

**Files Modified:** `apps/golf/src/app/build-team/[competitionId]/page.tsx`

**Future Improvement:** Consider creating instance AFTER team is built, not before (requires architectural change)

---

### 3. **Incorrect Status Management**
**Problem:** Instances marked as `status='full'` with `current_players=2` despite only creator (1 player) existing
- MY Scorecards API filters `.in('status', ['open', 'active'])` 
- Challenges with `status='full'` were invisible on My Scorecards page
- 3 out of 6 instances had wrong status

**Root Cause:** Unknown - possibly database trigger malfunction or race condition

**Database Trigger Found:** `competition_instances_auto_spawn` automatically updates `current_players` and changes status to 'full' when 2nd player joins

**Fix Applied:**
- SQL script to reset all instances: `UPDATE competition_instances SET status='open', current_players=1 WHERE status='full' AND current_players <= 1`
- Manual correction via `fix-all-instances.sql`

**Prevention:** Need to investigate why trigger fires incorrectly or why current_players increments without actual entries

---

### 4. **Entry Fee Display Inconsistencies**
**Problem:** Entry fees showing differently between:
- ONE 2 ONE challenge creation page
- Challenge Board
- My Scorecards listings

**Status:** Reported but not yet investigated
**Next Step:** Compare `entry_fee_pennies` values across:
- `competition_templates.entry_fee_pennies`
- `competition_instances.entry_fee_pennies`
- `competition_entries.entry_fee_paid`

---

### 5. **Tournament Slug URL Issue**
**Problem:** URL showing `/one-2-one/nedbank-golf-challenge-in-honour-of-gary-player` when viewing Alfred Dunhill Championship challenges

**Investigation:** All 7 instances correctly linked to Alfred Dunhill Championship in database
**Likely Cause:** Browser navigation cache or React router state persisting old slug
**Status:** Not a database issue - client-side routing problem

---

## Database Findings

### Competition Instances
- **7 total instances** created during testing
- **3 had status='full'** (incorrectly)
- **4 had status='open'** (correct)
- **All 7** linked to correct tournament (Alfred Dunhill Championship)
- **4 orphaned** (no corresponding entries)

### Competition Entries
- **3 total entries** created
- All 3 correctly linked to instances
- Entry fees correctly deducted from wallet

### Database Triggers
1. `competition_instances_auto_spawn` - Updates current_players and status
2. `competition_instances_updated_at` - Timestamp management

---

## Scripts Created for Testing/Cleanup

1. **diagnose-admin-challenges.sql** - Find admin user and check entries
2. **check-all-instances.sql** - View all instance statuses
3. **fix-challenge-status-simple.sql** - Fix instances marked 'full' incorrectly
4. **fix-all-instances.sql** - Reset ALL instances to 'open' status
5. **debug-entries-now.sql** - Comprehensive view of entries and instances
6. **show-everything.sql** - Display all competition_entries and instances
7. **investigate-duplicate-instances.sql** - Check for duplicate creation patterns
8. **check-orphaned-instances.sql** - Find instances without entries
9. **check-tournament-slugs.sql** - Verify tournament linkages
10. **complete-cleanup-fresh-start.sql** - Full cleanup for fresh testing

---

## Recommendations Before Fresh Testing

### Immediate Actions:
1. ✅ Run `complete-cleanup-fresh-start.sql` to clear all ONE 2 ONE data
2. ✅ Code fixes already applied (double-click prevention, navigation warnings)
3. ⏳ Test with fresh data to verify fixes work

### Future Improvements:
1. **Change Instance Creation Flow:**
   - Don't create instance until team is submitted
   - Or implement "draft" status for incomplete entries
   
2. **Investigate Database Trigger:**
   - Why does `competition_instances_auto_spawn` set `current_players=2`?
   - Add logging to trigger to trace when it fires
   
3. **Add Transaction Logging:**
   - Log every instance creation with timestamp and user
   - Track button clicks to detect duplicates
   
4. **Improve UX:**
   - Show toast notification: "Creating your challenge..."
   - Disable entire form during submission, not just button
   - Add countdown/progress indicator

---

## Testing Protocol After Cleanup

1. Create 1 challenge - verify only 1 instance created
2. Navigate away from team builder - verify warning appears
3. Complete 1 challenge - verify entry and instance properly linked
4. Check My Scorecards - verify challenge appears with correct status
5. Verify entry fees match across all displays
6. Test from different tournament pages - verify correct slug used

---

## Summary

**Issues Fixed:**
- ✅ Double-click creating duplicates
- ✅ No loading feedback during submission
- ✅ No warning when leaving team builder
- ✅ Instances marked 'full' incorrectly

**Issues Identified (Not Yet Fixed):**
- ⏳ Entry fee display inconsistencies
- ⏳ Tournament slug caching in URL
- ⏳ Root cause of incorrect status='full'
- ⏳ Orphaned instances when user abandons team building

**Ready for Fresh Testing:** Yes, after running cleanup script

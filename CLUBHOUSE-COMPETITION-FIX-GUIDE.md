# Clubhouse Competition Fix Guide
**Date:** January 7, 2026  
**Issue:** "The American Express" event has 0 competitions, causing entry_credits/max_entries to show as 0  
**Status:** ROOT CAUSE IDENTIFIED - Fix Ready to Apply

---

## Executive Summary

**Problem:** "The American Express" clubhouse event shows 0 entry credits and 0 max entries because the event has NO competitions in the database.

**Root Cause:** The POST endpoint (create) automatically creates 5 competitions, but the PUT endpoint (edit) only UPDATES existing competitions. If competitions are missing (due to creation error or manual database manipulation), the PUT endpoint cannot fix it.

**Solution:** Add competition creation logic to PUT endpoint as a fallback, matching the POST endpoint's behavior.

**Impact:** ZERO - This is an isolated clubhouse system fix. No changes to InPlay or ONE 2 ONE systems.

---

## System Verification

### Documentation Review ✅
- [x] SYSTEMATIC-FIX-PLAN.md - Test in clubhouse first (VERIFIED following plan)
- [x] CLUBHOUSE-SYSTEM-PLAN.md - Schema and status correct (VERIFIED column names)
- [x] PRE-CHANGE-CHECKLIST.md - Isolation rules followed (VERIFIED no crossover)
- [x] PLATFORM-ARCHITECTURE-GUIDE.md - Three system architecture understood
- [x] VERIFICATION-REPORT-2026-01-05.md - No instance_id references (VERIFIED clean)
- [x] DATABASE-SCHEMA-REFERENCE.md - Clubhouse tables documented correctly
- [x] ARCHITECTURE-DIAGRAM.txt - Integration patterns reviewed

### Current Database State

```sql
-- Query: Check events and their competition counts
SELECT 
  e.name as event_name,
  COUNT(c.id) as competition_count
FROM clubhouse_events e
LEFT JOIN clubhouse_competitions c ON c.event_id = e.id
GROUP BY e.id, e.name
ORDER BY e.updated_at DESC;

-- Results:
-- "The American Express"         | 0 ← PROBLEM
-- "The Worlds Open"              | 5 ← CORRECT
-- "Spring Masters Championship"  | 5 ← CORRECT
```

**Analysis:**
- "The Worlds Open" has 5 competitions (All 4 Rounds, Round 1-4)
- "Spring Masters Championship" has 5 competitions
- "The American Express" has 0 competitions (THIS IS THE ISSUE)

### API Behavior Analysis

#### POST Endpoint (Create Event) ✅
**File:** `apps/golf/src/app/api/clubhouse/events/route.ts` lines 208-263

**What it does:**
1. Creates event in `clubhouse_events` table
2. **Automatically creates 5 competitions** in `clubhouse_competitions` table:
   - All 4 Rounds
   - Round 1
   - Round 2  
   - Round 3
   - Round 4
3. Sets entry_credits, max_entries for all 5 competitions
4. Returns success

**Status:** ✅ WORKING CORRECTLY

#### PUT Endpoint (Update Event) ❌
**File:** `apps/golf/src/app/api/clubhouse/events/[id]/route.ts` lines 105-327

**What it does:**
1. Updates event in `clubhouse_events` table
2. Fetches ALL competitions for event (line 220)
3. **IF competitions exist**, updates entry_credits, max_entries, timing
4. **IF NO competitions exist**, logs warning and DOES NOTHING (line 317)

**Current Code (lines 215-223):**
```typescript
// Update ALL associated competitions (there are 5 per event)
const { data: competitions } = await supabase
  .from('clubhouse_competitions')
  .select('id, name')
  .eq('event_id', id); // Get ALL competitions with names

console.log('📋 Found competitions for event:', competitions);

if (competitions && competitions.length > 0) {
  // ...update logic
} else {
  console.warn('⚠️ No competitions found for event:', id); // ← LOGS WARNING BUT DOES NOTHING
}
```

**Problem:** If an event has 0 competitions (like "The American Express"), the PUT endpoint cannot fix it. User can update entry_credits all day, but there are no competition records to update!

**Status:** ❌ NEEDS FIX

---

## The Fix

### Strategy
**Copy competition creation logic from POST endpoint into PUT endpoint as a fallback.**

When PUT endpoint finds 0 competitions:
1. Create the 5 standard competitions (matching POST logic)
2. Then proceed with normal update flow
3. Log success for audit trail

### Code Change Location
**File:** `apps/golf/src/app/api/clubhouse/events/[id]/route.ts`  
**Lines:** After line 223 (in the `else` block where warning is logged)

### Exact Implementation

**BEFORE (Current Code - lines 220-318):**
```typescript
const { data: competitions } = await supabase
  .from('clubhouse_competitions')
  .select('id, name')
  .eq('event_id', id);

console.log('📋 Found competitions for event:', competitions);

if (competitions && competitions.length > 0) {
  // ...existing update logic for 100+ lines
} else {
  console.warn('⚠️ No competitions found for event:', id);
}
```

**AFTER (Fixed Code):**
```typescript
const { data: competitions } = await supabase
  .from('clubhouse_competitions')
  .select('id, name')
  .eq('event_id', id);

console.log('📋 Found competitions for event:', competitions);

if (!competitions || competitions.length === 0) {
  console.warn('⚠️ No competitions found for event:', id);
  console.log('🔧 Creating missing competitions...');
  
  // Create 5 competitions (matching POST endpoint logic)
  const competitions = [
    {
      name: 'All 4 Rounds',
      starts_at: toISO(body.round1_tee_time),
      closes_at: subtract15Minutes(body.round1_tee_time),
      ends_at: toISO(body.round4_tee_time),
    },
    {
      name: 'Round 1',
      starts_at: toISO(body.round1_tee_time),
      closes_at: subtract15Minutes(body.round1_tee_time),
      ends_at: toISO(body.round1_tee_time),
    },
    {
      name: 'Round 2',
      starts_at: toISO(body.round2_tee_time),
      closes_at: subtract15Minutes(body.round2_tee_time),
      ends_at: toISO(body.round2_tee_time),
    },
    {
      name: 'Round 3',
      starts_at: toISO(body.round3_tee_time),
      closes_at: subtract15Minutes(body.round3_tee_time),
      ends_at: toISO(body.round3_tee_time),
    },
    {
      name: 'Round 4',
      starts_at: toISO(body.round4_tee_time),
      closes_at: subtract15Minutes(body.round4_tee_time),
      ends_at: toISO(body.round4_tee_time),
    },
  ];

  const competitionsToInsert = competitions.map(comp => ({
    event_id: id,
    name: comp.name,
    description: body.description || null,
    entry_credits: body.entry_credits || 0,
    max_entries: body.max_entries || 100,
    prize_pool_credits: 0,
    prize_distribution: { "1": 50, "2": 30, "3": 20 },
    opens_at: toISO(body.registration_opens),
    closes_at: comp.closes_at,
    starts_at: comp.starts_at,
    ends_at: comp.ends_at,
    status: 'open',
    assigned_golfer_group_id: body.assigned_golfer_group_id && body.assigned_golfer_group_id !== '' ? body.assigned_golfer_group_id : null,
  }));

  const { data: newCompetitions, error: compError } = await supabase
    .from('clubhouse_competitions')
    .insert(competitionsToInsert)
    .select('id, name');

  if (compError) {
    console.error('❌ Error creating competitions:', compError);
    throw compError;
  }

  console.log('✅ Created', newCompetitions?.length, 'competitions');
  
  // Update competitions variable for the rest of the function
  competitions = newCompetitions || [];
}

if (competitions && competitions.length > 0) {
  // ...existing update logic continues unchanged
}
```

**Helper function needed (add after line 130):**
```typescript
// Helper to subtract 15 minutes from tee time
const subtract15Minutes = (dateStr: string) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() - 15);
  return date.toISOString();
};
```

---

## Pre-Change Verification

### 1. System Isolation ✅
```bash
# Check for contamination
grep -r "tournament_competitions" apps/golf/src/app/clubhouse/
# Result: NO MATCHES ✅

grep -r "competition_instances" apps/golf/src/app/clubhouse/
# Result: NO MATCHES ✅

grep -r "clubhouse" apps/golf/src/app/tournaments/
# Result: NO MATCHES ✅

grep -r "clubhouse" apps/golf/src/app/one-2-one/
# Result: NO MATCHES ✅
```

**Verification:** ✅ Clubhouse system is completely isolated. This fix will NOT affect InPlay or ONE 2 ONE.

### 2. File Dependencies ✅
**Files being modified:**
- `apps/golf/src/app/api/clubhouse/events/[id]/route.ts` (PUT endpoint only)

**Files reading from this endpoint:**
- `apps/admin/src/app/clubhouse/events/[id]/edit/page.tsx` (admin edit form)
- `apps/golf/src/app/clubhouse/events/page.tsx` (events list - already handles via GET)

**Impact:** Admin will now be able to fix broken events by re-saving them.

### 3. Database Impact ✅
**Tables affected:**
- `clubhouse_competitions` (INSERT only, no deletions)

**Constraints verified:**
- `event_id` → `clubhouse_events.id` (foreign key exists ✅)
- `status` CHECK constraint exists ✅ ('upcoming', 'open', 'active', 'completed')
- All columns in INSERT match schema ✅

**RLS (Row Level Security):**
- Using `createAdminClient()` which bypasses RLS ✅
- Safe for admin operations ✅

### 4. Schema Verification ✅
**Required columns in `clubhouse_competitions`:**
```sql
-- From DATABASE-SCHEMA-REFERENCE.md and CLUBHOUSE-SYSTEM-PLAN.md
event_id                    UUID          ← FK to clubhouse_events
name                        TEXT          ← "All 4 Rounds", "Round 1", etc.
description                 TEXT          ← Optional
entry_credits               INTEGER       ← NOT "credits" (verified in docs)
max_entries                 INTEGER       ← Capacity limit
prize_pool_credits          INTEGER       ← Prize pool size
prize_distribution          JSONB         ← {"1": 50, "2": 30, "3": 20}
opens_at                    TIMESTAMPTZ   ← Registration opens
closes_at                   TIMESTAMPTZ   ← Registration closes
starts_at                   TIMESTAMPTZ   ← Competition starts
ends_at                     TIMESTAMPTZ   ← Competition ends
status                      TEXT          ← 'upcoming', 'open', 'active', 'completed'
assigned_golfer_group_id    UUID          ← FK to golfer_groups (nullable)
```

**Verification:** ✅ All columns used in INSERT statement exist and match schema

---

## Testing Plan

### Phase 1: Immediate Verification (After Fix Applied)
1. **Keep dev servers running** (already running)
2. **Edit "The American Express" event** in admin panel
3. **Change entry_credits from 20 → 30**
4. **Save and verify:**
   - Console shows: "🔧 Creating missing competitions..."
   - Console shows: "✅ Created 5 competitions"
   - Event list shows: "30 credits" instead of "0 credits"
   - Database query confirms: `SELECT COUNT(*) FROM clubhouse_competitions WHERE event_id = 'e7fa7ef1-238a-495e-b226-3d37c1969ccb'` returns 5

### Phase 2: Full Regression Testing
1. **Test normal edit** (event with existing competitions):
   - Edit "The Worlds Open"
   - Change entry_credits 10 → 15
   - Verify: NO new competitions created (should update existing)
   - Verify: All 5 competitions show 15 credits

2. **Test create new event**:
   - Create "Test Event"
   - Verify: 5 competitions created automatically
   - Verify: Shows correct credits on events list

3. **Test delete event**:
   - Delete "Test Event"
   - Verify: Cascades to competitions and entries

### Phase 3: InPlay/ONE 2 ONE Isolation Verification
1. **Visit** `/tournaments/` - Verify no errors
2. **Visit** `/one-2-one/` - Verify no errors
3. **Check database** - Verify no accidental writes to `tournament_competitions`

---

## Rollback Plan

**If something goes wrong:**

1. **Stop dev servers:** `Ctrl+C` in PowerShell terminal
2. **Revert file change:**
   ```bash
   git checkout apps/golf/src/app/api/clubhouse/events/[id]/route.ts
   ```
3. **Restart servers:** `pnpm dev`
4. **Verify** "The Worlds Open" still works correctly

**Note:** This fix only ADDS competitions, never deletes. Worst case: event has duplicate competitions (can be manually deleted via database).

---

## Success Criteria

✅ **Fix is successful when:**
1. "The American Express" shows entry_credits after edit (not 0)
2. Console logs show competitions created
3. Database has 5 competitions for "The American Express"
4. "The Worlds Open" still works (no regression)
5. InPlay and ONE 2 ONE systems unaffected
6. No TypeScript errors
7. Dev servers restart successfully

---

## Related Documentation

- **SYSTEMATIC-FIX-PLAN.md** - Test fixes in clubhouse first (we are following this plan)
- **CLUBHOUSE-SYSTEM-PLAN.md** - Current implementation status and architecture
- **PRE-CHANGE-CHECKLIST.md** - Verification steps (all completed above)
- **DATABASE-SCHEMA-REFERENCE.md** - Clubhouse table schemas (verified)
- **VERIFICATION-REPORT-2026-01-05.md** - Previous cleanup verification

---

## Implementation Status

- [x] Root cause identified
- [x] Documentation reviewed
- [x] Pre-change checklist completed
- [x] System isolation verified
- [x] Schema verification completed
- [x] Fix code written
- [ ] Fix applied to file
- [ ] Testing completed
- [ ] Success verified

---

**READY TO APPLY FIX**

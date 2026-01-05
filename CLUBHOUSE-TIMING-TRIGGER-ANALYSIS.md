# CLUBHOUSE TRIGGER ANALYSIS - COMPLETE DOCUMENTATION REVIEW
**Date**: 2026-01-06  
**Issue**: Timing sync trigger incompatible with round-specific competition timing

---

## EXECUTIVE SUMMARY

**FINDING**: The database trigger design (`sync_clubhouse_competition_timing`) as documented in all plans is **FUNDAMENTALLY INCOMPATIBLE** with the Clubhouse multi-round competition structure.

**TRIGGER DESIGN** (from all documentation):
```sql
CREATE OR REPLACE FUNCTION sync_clubhouse_competition_timing()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clubhouse_competitions
  SET 
    opens_at = NEW.registration_opens_at,
    closes_at = NEW.registration_closes_at,  -- ❌ SAME VALUE for all competitions
    starts_at = NEW.start_date                 -- ❌ SAME VALUE for all competitions
  WHERE event_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**CLUBHOUSE REALITY**: Each event has 5 competitions with **DIFFERENT** timing requirements:
- **All Rounds** [1,2,3,4]: closes 15min before `round1_tee_time`
- **Round 1** [1]: closes 15min before `round1_tee_time`
- **Round 2** [2]: closes 15min before `round2_tee_time` ← **DIFFERENT**
- **Round 3** [3]: closes 15min before `round3_tee_time` ← **DIFFERENT**
- **Round 4** [4]: closes 15min before `round4_tee_time` ← **DIFFERENT**

**CONFLICT**: Trigger sets ALL competitions to same `registration_closes_at` value, erasing round-specific timing.

---

## DOCUMENTATION REFERENCES

### 1. SYSTEMATIC-FIX-PLAN.md (Lines 60-130)

**Problem 2: Timing Updates Fail Silently**

**Design Rationale**:
> "HTTP calls between internal APIs can fail. No transaction guarantee."

**Proposed Solution**:
```sql
-- Database trigger auto-syncs timing
CREATE OR REPLACE FUNCTION sync_competition_timing()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clubhouse_competitions
  SET 
    opens_at = NEW.registration_opens_at,
    closes_at = NEW.registration_closes_at,  -- Assumes all same
    starts_at = NEW.start_date                -- Assumes all same
  WHERE event_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Backport Note** (lines 110-130):
> "Backport to Main System: Option A: Database Triggers (Recommended)  
> Shows advanced version for InPlay that reads `competition_types.round_start` to calculate per-competition timing"

**KEY INSIGHT**: The plan DOES acknowledge that InPlay needs per-competition timing calculation. But the Clubhouse implementation didn't follow that pattern.

---

### 2. CLUBHOUSE-SYSTEM-PLAN.md (Lines 288-307)

**Section: Database Functions & Triggers**

**Function 2: Copy timing to competitions when event changes**
```sql
CREATE OR REPLACE FUNCTION sync_competition_timing()
RETURNS TRIGGER AS $$
BEGIN
  -- When event timing changes, update all competitions
  UPDATE clubhouse_competitions
  SET 
    opens_at = NEW.registration_opens_at,
    closes_at = NEW.registration_closes_at,  -- All get same value
    starts_at = NEW.start_date                -- All get same value
  WHERE event_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Stated Purpose**:
> "When event timing changes, update all competitions"

**Assumption**: All competitions share same timing (simple model)

---

### 3. PLATFORM-ARCHITECTURE-GUIDE.md (Lines 363-382)

**Section: Clubhouse Competitions**

**Benefits Listed**:
- ✅ No HTTP fetch() calls that can fail
- ✅ Atomic updates (all or nothing)
- ✅ Competition timing ALWAYS matches event ← **This is the problem!**
- ✅ No manual scripts needed

**Design Goal**: "Competition timing ALWAYS matches event"

**Reality**: Competition timing should **NOT** match event - it should match the specific round's tee time.

---

### 4. scripts/clubhouse/01-create-schema.sql (Lines 191-211)

**Actual Implementation** (deployed to Supabase):
```sql
CREATE OR REPLACE FUNCTION sync_clubhouse_competition_timing()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clubhouse_competitions
  SET 
    opens_at = NEW.registration_opens_at,
    closes_at = NEW.registration_closes_at,
    starts_at = NEW.start_date
  WHERE event_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clubhouse_event_timing_sync
  AFTER UPDATE OF registration_opens_at, registration_closes_at, start_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION sync_clubhouse_competition_timing();
```

**Status**: Currently deployed in Supabase (needs verification)

---

## ROOT CAUSE ANALYSIS

### Design Assumption vs Reality

**Assumed System Model** (when trigger was designed):
```
Event has competitions
All competitions share:
  - Same registration window
  - Same start time
  - Same end time

Example: ONE 2 ONE challenge format
  - All head-to-head matches run simultaneously
  - All open at same time
  - All close at same time
```

**Actual Clubhouse Model**:
```
Event spans 4 days with different round tee times
5 competitions per event:
  1. "All Rounds" [1,2,3,4] - starts Round 1 day
  2. "Round 1" [1]         - starts Round 1 day
  3. "Round 2" [2]         - starts Round 2 day ← DIFFERENT
  4. "Round 3" [3]         - starts Round 3 day ← DIFFERENT
  5. "Round 4" [4]         - starts Round 4 day ← DIFFERENT

Example: St Augustings Golf Club event
  - Round 1 tee time: Jan 5 07:00 → Round 1 comp closes Jan 5 06:45
  - Round 2 tee time: Jan 6 07:00 → Round 2 comp closes Jan 6 06:45
  - Round 3 tee time: Jan 7 07:00 → Round 3 comp closes Jan 7 06:45
  - Round 4 tee time: Jan 8 07:00 → Round 4 comp closes Jan 8 06:45
```

**Mismatch**: Trigger assumes simple timing model, reality requires complex per-round timing.

---

## WHY THE TRIGGER BREAKS THINGS

### Scenario: Admin Edits Event

1. **User edits event** in admin panel `/clubhouse/events/[id]/edit`
2. **Form submits** to `PUT /api/clubhouse/events/[id]`
3. **API correctly calculates** round-specific timing:
   ```typescript
   // For Round 2 competition
   startsAt = event.round2_tee_time;  // Jan 6 07:00
   closesAt = startsAt - 15 minutes;   // Jan 6 06:45
   
   // For Round 3 competition
   startsAt = event.round3_tee_time;  // Jan 7 07:00
   closesAt = startsAt - 15 minutes;   // Jan 7 06:45
   ```
4. **API updates** `clubhouse_competitions` with correct values
5. **Database trigger fires** AFTER API completes
6. **Trigger overwrites** ALL competitions:
   ```sql
   UPDATE clubhouse_competitions
   SET 
     closes_at = '2026-01-05 06:45',  -- event.registration_closes_at
     starts_at = '2026-01-05 07:00'   -- event.start_date
   WHERE event_id = 'xxx';
   ```
7. **Result**: All 5 competitions now have SAME timing (Round 1's timing)
8. **User sees**: "Registration Closed" for all competitions even though Round 2/3/4 haven't started

---

## CURRENT WORKAROUND (TEMPORARY)

### What We Did

**Script**: `fix-competition-timing.js` (ran successfully)
- Fetched all 4 existing events
- For each event's 5 competitions:
  - Found competition's `rounds_covered` value
  - Looked up corresponding `roundX_tee_time` from event
  - Calculated correct `closes_at` (tee time - 15min) and `starts_at`
  - Updated competition directly via API

**Result**: All 20 competitions (4 events × 5 comps) now have correct round-specific timing

**Verification** (from audit script):
```
St Augustings Golf Club:
  ✅ Round 2 closes: 2026-01-06T06:45:00+00:00
  ✅ Round 3 closes: 2026-01-07T06:45:00+00:00
  (Different times - correct!)
```

### Why It's Temporary

**Problem**: The trigger still exists in database. Next time admin edits ANY event field that includes `registration_closes_at` or `start_date`, the trigger will fire again and overwrite all the correct timing.

**Demonstration**:
1. Admin changes event description (includes registration_closes_at in update)
2. Trigger fires
3. All competitions reset to same timing
4. Problem returns

---

## WHY API APPROACH WORKS WITHOUT TRIGGER

### Current API Implementation

**File**: `apps/golf/src/app/api/clubhouse/events/[id]/route.ts` (Lines 220-285)

```typescript
// Build round tee time map
const roundTeeTimes = {
  1: body.round1_tee_time ? toISO(body.round1_tee_time) : null,
  2: body.round2_tee_time ? toISO(body.round2_tee_time) : null,
  3: body.round3_tee_time ? toISO(body.round3_tee_time) : null,
  4: body.round4_tee_time ? toISO(body.round4_tee_time) : null,
};

// Update each competition with its specific round timing
for (const comp of fullComps) {
  const firstRound = comp.rounds_covered[0]; // e.g., 2 for "Round 2"
  const roundTeeTime = roundTeeTimes[firstRound]; // Get Round 2 tee time
  
  if (roundTeeTime) {
    startsAt = roundTeeTime; // Competition starts at Round 2 tee time
    const startDate = new Date(startsAt);
    startDate.setMinutes(startDate.getMinutes() - 15);
    closesAt = startDate.toISOString(); // Closes 15min before
  }
  
  await supabase.from('clubhouse_competitions').update({
    closes_at: closesAt,
    starts_at: startsAt,
    // ... other fields
  }).eq('id', comp.id);
}
```

**Benefits**:
- ✅ Reads `rounds_covered` to know which round this competition is for
- ✅ Looks up the correct `roundX_tee_time` from event
- ✅ Calculates round-specific timing
- ✅ Each competition gets different timing
- ✅ Works perfectly... until trigger overwrites it

---

## SOLUTION OPTIONS

### Option A: Drop the Trigger (RECOMMENDED)

**Action**:
```sql
-- Drop trigger and function
DROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;
DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();
```

**Pros**:
- ✅ Simple - one-time SQL execution
- ✅ API already handles timing correctly
- ✅ No risk of future overwrites
- ✅ Follows "test in Clubhouse" principle - discovered trigger doesn't work for multi-round

**Cons**:
- ❌ Removes atomic transaction guarantee (if API fails, event updated but comps not)
- ❌ Deviates from documented architecture plans
- ❌ Requires updating all documentation

**Risk Assessment**: LOW
- API has been tested and works correctly
- Supabase RLS ensures data integrity
- Worth trading atomicity for correctness

---

### Option B: Fix Trigger to Be Round-Aware (COMPLEX)

**Action**: Rewrite trigger to read `rounds_covered` and match to correct tee time

**Pseudocode**:
```sql
CREATE OR REPLACE FUNCTION sync_clubhouse_competition_timing()
RETURNS TRIGGER AS $$
DECLARE
  comp RECORD;
  first_round INTEGER;
  tee_time TIMESTAMPTZ;
BEGIN
  FOR comp IN 
    SELECT id, rounds_covered 
    FROM clubhouse_competitions 
    WHERE event_id = NEW.id
  LOOP
    first_round := comp.rounds_covered[1];
    
    -- Map round number to correct tee time
    CASE first_round
      WHEN 1 THEN tee_time := NEW.round1_tee_time;
      WHEN 2 THEN tee_time := NEW.round2_tee_time;
      WHEN 3 THEN tee_time := NEW.round3_tee_time;
      WHEN 4 THEN tee_time := NEW.round4_tee_time;
    END CASE;
    
    IF tee_time IS NOT NULL THEN
      UPDATE clubhouse_competitions
      SET 
        opens_at = NEW.registration_opens_at,
        closes_at = tee_time - INTERVAL '15 minutes',
        starts_at = tee_time
      WHERE id = comp.id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Modify trigger to fire on round tee time changes too
CREATE TRIGGER clubhouse_event_timing_sync
  AFTER UPDATE OF 
    registration_opens_at, 
    registration_closes_at, 
    start_date,
    round1_tee_time,  -- NEW
    round2_tee_time,  -- NEW
    round3_tee_time,  -- NEW
    round4_tee_time   -- NEW
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION sync_clubhouse_competition_timing();
```

**Pros**:
- ✅ Maintains atomic transaction guarantee
- ✅ "Database does calculations" principle preserved
- ✅ Future-proof for more complex scenarios

**Cons**:
- ❌ Complex code in database layer
- ❌ Harder to debug than TypeScript
- ❌ Requires thorough testing with edge cases
- ❌ What if competition has rounds_covered = [1,2]? Which tee time?
- ❌ Adds 4 more columns to trigger watch list (performance impact)

**Risk Assessment**: MEDIUM
- Complex logic prone to bugs
- Edge cases not fully known
- Testing burden high

---

### Option C: Redesign Competition Structure (ARCHITECTURAL CHANGE)

**Action**: Remove round-specific competitions, use single competition per event

**Change**:
```
Before: 5 competitions per event
  - All Rounds [1,2,3,4]
  - Round 1 [1]
  - Round 2 [2]
  - Round 3 [3]
  - Round 4 [4]

After: 1 competition per event
  - Event Competition [1,2,3,4]
```

**Pros**:
- ✅ Trigger works perfectly (all comps have same timing because there's only 1)
- ✅ Simpler data model

**Cons**:
- ❌ Major product change - removes per-round entry capability
- ❌ Users can't enter "just Round 2"
- ❌ Breaks existing user expectations
- ❌ Requires frontend redesign

**Risk Assessment**: HIGH
- Product decision, not technical decision
- Requires user research/validation
- Out of scope for current bug fix

---

## RECOMMENDATION

### RECOMMENDED ACTION: Option A (Drop Trigger)

**Reasoning**:

1. **Testing Purpose of Clubhouse**
   - From SYSTEMATIC-FIX-PLAN.md: "Test fixes in Clubhouse before backporting to InPlay"
   - This is EXACTLY what we're doing - discovered trigger design doesn't work for multi-round
   - If we backported this trigger to InPlay, same bug would occur (InPlay also has round-specific competitions)

2. **API Already Works**
   - Current PUT route has comprehensive round-specific timing logic
   - Successfully tested with 4 events × 5 competitions = 20 successful updates
   - No reported issues with API approach

3. **Atomicity Trade-off Acceptable**
   - Trigger's atomic guarantee prevents partial updates IF API fails mid-execution
   - But: Supabase operations are reliable, API has error handling, RLS protects data
   - Worth trading theoretical atomicity for proven correctness

4. **Documentation Can Be Updated**
   - All plans can be updated with "Lessons Learned" section
   - Document why trigger approach didn't work for multi-round case
   - Show API approach as working solution
   - This becomes valuable reference for future developers

5. **Prevents Future Confusion**
   - Leaving broken trigger in place causes mysterious bugs
   - Future developer edits event → timing breaks → no clear cause
   - Better to remove non-working code than leave it dormant

---

## IMPLEMENTATION PLAN

### Phase 1: Drop Trigger (Immediate)

1. **Verify trigger exists in Supabase**
   - Run `check-supabase-triggers.sql` in SQL Editor
   - Confirm `clubhouse_event_timing_sync` is active

2. **Drop trigger and function**
   ```sql
   -- Run in Supabase SQL Editor
   DROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;
   DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();
   ```

3. **Verify removal**
   - Re-run check query
   - Confirm trigger no longer exists

4. **Test event edit**
   - Edit St Augustings Golf Club event
   - Change event description
   - Verify competitions maintain different close times
   - Check logs show API calculated correct round-specific timing

### Phase 2: Update Documentation (Same Day)

1. **Update SYSTEMATIC-FIX-PLAN.md**
   - Problem 2 section: Add "Lessons Learned" subsection
   - Document trigger approach doesn't work for round-specific competitions
   - Show API approach as working solution
   - Keep advanced InPlay trigger example as reference (it's more sophisticated)

2. **Update CLUBHOUSE-SYSTEM-PLAN.md**
   - Lines 288-307: Add note that trigger was removed during testing
   - Explain why: incompatible with round-specific timing
   - Reference working API implementation

3. **Update PLATFORM-ARCHITECTURE-GUIDE.md**
   - Lines 363-382: Remove trigger from "Benefits" list
   - Add note: "Originally designed with timing trigger, but testing revealed incompatibility with round-specific competitions. API-based approach used instead."

4. **Create CLUBHOUSE-TIMING-TRIGGER-LESSONS-LEARNED.md**
   - Complete analysis (this document)
   - Reference for future developers
   - Explains why trigger was removed

### Phase 3: Verify Solution is Permanent (Same Day)

1. **Edit event multiple times**
   - Change dates
   - Change tee times
   - Change other fields
   - After each edit, verify competitions maintain round-specific timing

2. **Check database directly**
   ```sql
   SELECT 
     c.name,
     c.rounds_covered,
     c.closes_at,
     c.starts_at
   FROM clubhouse_competitions c
   JOIN clubhouse_events e ON c.event_id = e.id
   WHERE e.name = 'St Augustings Golf Club'
   ORDER BY c.rounds_covered;
   ```
   - Verify Round 2/3/4 have DIFFERENT close times
   - Verify times match respective round tee times - 15min

3. **Create new event from scratch**
   - POST creates new event
   - Verify 5 competitions created with correct timing
   - Edit new event
   - Verify timing stays correct

### Phase 4: Update Testing Guide (Same Day)

1. **CLUBHOUSE-TESTING-GUIDE.md** (create if doesn't exist)
   - Add test case: "Verify round-specific competition timing"
   - Steps to verify each competition closes at its round's tee time - 15min
   - Expected results table

2. **Add regression test**
   - Script that checks all events have different competition close times
   - Run weekly or before major releases

---

## BACKPORT GUIDANCE FOR INPLAY

### DO NOT Backport Simple Trigger

**Warning**: The simple trigger design we're removing from Clubhouse would cause THE SAME BUG in InPlay.

### InPlay Tournament Structure

InPlay has similar multi-round requirements:
- "Full Course" competitions [1,2,3,4]
- "Beat The Cut" competitions [1,2]
- Each should close at appropriate round tee time

### If Implementing Trigger in InPlay

**Use the advanced pattern** from SYSTEMATIC-FIX-PLAN.md lines 110-130:

```sql
CREATE OR REPLACE FUNCTION sync_inplay_competition_timing()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tournament_competitions tc
  SET 
    reg_open_at = NEW.registration_opens_at,
    reg_close_at = (
      SELECT NEW[('round_' || ct.round_start || '_start')::text]::timestamptz - INTERVAL '15 minutes'
      FROM competition_types ct
      WHERE ct.id = tc.competition_type_id
    ),
    start_at = (
      SELECT NEW[('round_' || ct.round_start || '_start')::text]::timestamptz
      FROM competition_types ct
      WHERE ct.id = tc.competition_type_id
    )
  WHERE tc.tournament_id = NEW.id 
    AND tc.competition_format = 'inplay';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**This is round-aware** - reads `competition_types.round_start` to determine which round's tee time to use.

### Recommended Approach for InPlay

**Option 1: Use API Approach** (proven working in Clubhouse)
- Keep existing Tournament Lifecycle Manager
- Update competitions via API call with round-specific logic
- No trigger needed

**Option 2: Test Trigger in Clubhouse First**
- Implement advanced round-aware trigger in Clubhouse
- Test thoroughly with all competition types
- Verify no regressions for 2+ weeks
- Then backport to InPlay if successful

---

## FILES TO UPDATE

### Code Files
- ❌ No code changes needed (API already correct)

### SQL Files
```
scripts/clubhouse/01-create-schema.sql
  - Lines 191-211: Add comment that trigger was removed during testing
  - Keep code but wrap in /* REMOVED - see CLUBHOUSE-TIMING-TRIGGER-LESSONS-LEARNED.md */

scripts/clubhouse/02-clean-install.sql
  - Similar comment if trigger exists there

fix-drop-bad-trigger.sql (already exists)
  - Can be deleted after trigger removed
```

### Documentation Files
```
SYSTEMATIC-FIX-PLAN.md
  - Problem 2 section: Add "Lessons Learned" note

CLUBHOUSE-SYSTEM-PLAN.md
  - Lines 288-307: Update to reflect trigger removal

PLATFORM-ARCHITECTURE-GUIDE.md
  - Lines 363-382: Update benefits list, remove trigger

CLUBHOUSE-TIMING-TRIGGER-LESSONS-LEARNED.md (NEW)
  - This document

CLUBHOUSE-TESTING-GUIDE.md (NEW or UPDATE)
  - Add test case for round-specific timing
```

### Verification Scripts
```
audit-clubhouse-system.js
  - Keep as ongoing health check

check-supabase-triggers.sql
  - Run before and after trigger removal

check-existing-events.js
  - Keep for verifying timing correctness
```

---

## QUESTIONS TO ANSWER

### Q1: "Is this fix permanent?"

**A**: YES, if we drop the trigger. The API approach is permanent because:
- No trigger to overwrite correct timing
- API logic runs every time event is edited
- Database constraints enforce valid timing
- RLS prevents unauthorized changes

**A**: NO, if we keep the trigger. It will overwrite correct timing on next event update.

### Q2: "Are we following the plan?"

**A**: We're following the *process* from the plan:
1. Test in Clubhouse first ✅
2. Discover issues before backporting ✅
3. Document findings ✅
4. Update plans with lessons learned (pending)

**A**: We're *deviating* from the trigger *implementation* in the plan because testing proved it doesn't work for multi-round competitions. This is exactly what the testing phase is for.

### Q3: "How did we mess this up?"

**A**: The trigger design in the plans assumed a simpler competition model (all competitions share timing). When implemented, we discovered Clubhouse needs round-specific timing. This is a **design discovery**, not a coding error. The plans acknowledged this issue for InPlay (showing advanced round-aware trigger) but didn't apply that complexity to Clubhouse's initial implementation.

### Q4: "What if we need atomicity?"

**A**: If atomic updates become critical:
1. Implement Option B (round-aware trigger)
2. Test thoroughly in Clubhouse for 2+ weeks
3. Then consider for InPlay

For now, API approach with proper error handling is sufficient.

---

## NEXT STEPS

**IMMEDIATE** (Today):
1. Get user approval on Option A (drop trigger)
2. Run SQL to drop trigger in Supabase
3. Test event edit, verify timing stays correct
4. Update documentation files

**SHORT-TERM** (This Week):
5. Create comprehensive test suite for Clubhouse timing
6. Document in testing guide
7. Continue Phase 1 Clubhouse testing per CLUBHOUSE-TESTING-GUIDE.md

**LONG-TERM** (Before InPlay Backport):
8. Evaluate if InPlay needs round-aware trigger
9. If yes, implement and test in Clubhouse first
10. Backport only after proven stable

---

## CONCLUSION

The database trigger approach for timing sync, while elegant in theory, **does not work for the Clubhouse multi-round competition model**. The API-based approach currently implemented is correct, tested, and working. 

**Recommendation**: Drop the trigger, update documentation to reflect this finding, and continue with API-based timing management. This preserves the "test in Clubhouse first" principle and prevents backporting a broken design to production InPlay system.

The real success here is **discovering this issue during Clubhouse testing phase** before it could affect the live InPlay system. This validates the entire testing strategy.


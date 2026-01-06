# Systematic Fix Plan - Test in Clubhouse, Apply to Main System

## Strategy
1. **Identify** each specific problem in current system
2. **Fix** in clubhouse system (clean implementation)
3. **Test** thoroughly with real data
4. **Validate** it's bulletproof (2-3 events minimum)
5. **Backport** proven solution to InPlay/ONE 2 ONE

---

## Problem 1: Status Value Inconsistency

### Current System Issue
- Database has: `live`, `registration_open`
- Code writes: `reg_open`, `reg_closed`
- API filters: Mix of both
- Frontend expects: Different values in different places
- **Result**: Competitions disappear randomly

### Root Cause
No single source of truth for status values. Different files use different conventions.

### Clubhouse Fix
```typescript
// Inline constants in each file (no shared package needed)
// Example: apps/golf/src/app/clubhouse/events/[id]/page.tsx
const COMPETITION_STATUS = {
  UPCOMING: 'upcoming',
  OPEN: 'open',
  ACTIVE: 'active',
  COMPLETED: 'completed'
} as const;

type CompetitionStatus = typeof COMPETITION_STATUS[keyof typeof COMPETITION_STATUS];

// Database constraint (scripts/clubhouse/01-create-schema.sql)
CHECK (status IN ('upcoming', 'open', 'active', 'completed'))
```

### Testing Checklist
- [ ] Create event, verify status = 'upcoming'
- [ ] Wait for registration to open, verify status = 'open'
- [ ] Start event, verify status = 'active'
- [ ] End event, verify status = 'completed'
- [ ] Check API returns correct status
- [ ] Check frontend displays correct badges
- [ ] Verify no database constraint violations

### Backport to Main System
1. Create `packages/shared/src/status-constants.ts`
2. Update database constraint to match
3. Update ALL files to import constants
4. Run migration to convert existing data
5. Test on staging tournament

**Files to update in main system:**
- `apps/admin/src/app/api/tournament-lifecycle/[id]/registration/route.ts` (line 196)
- `apps/admin/src/app/api/tournaments/[id]/competitions/calculate-times/route.ts` (line 49)
- `apps/golf/src/app/api/tournaments/[slug]/route.ts` (remove filter entirely)
- `apps/golf/src/app/tournaments/[slug]/page.tsx` (line 680)

---

## Problem 2: Timing Updates Fail Silently

### Current System Issue
- Lifecycle manager saves tournament dates
- Tries to update competitions via HTTP fetch()
- Fetch fails silently (network error, timeout, etc.)
- Competitions show wrong dates
- **Result**: Manual scripts needed constantly

### Root Cause
HTTP calls between internal APIs can fail. No transaction guarantee.

### Clubhouse Fix
```sql
-- Database trigger auto-syncs timing
CREATE OR REPLACE FUNCTION sync_competition_timing()
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

CREATE TRIGGER event_timing_sync
  AFTER UPDATE OF registration_opens_at, registration_closes_at, start_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION sync_competition_timing();
```

### Testing Checklist
- [ ] Update event date in admin
- [ ] Verify competition dates update automatically
- [ ] Check transaction log shows both updates
- [ ] Test with 10 competitions (stress test)
- [ ] Verify no partial updates (all or nothing)
- [ ] Test rollback on error

### Lessons Learned from Clubhouse Testing (2026-01-06)

**✅ RESOLVED: Registration Closes at START Instead of END**

**Discovery**: Database constraint `registration_closes_at <= start_date` blocked multi-day tournaments.

**Problem Flow**:
1. Multi-day tournament: Jan 5-8 (start on Jan 5, end on Jan 8)
2. Registration should close: Jan 8 at 06:45 (15min before Round 4 tee-off at 07:00)
3. Constraint checked: Jan 8 06:45 <= Jan 5? **FALSE** ❌
4. Database rejected insert/update

**Root Cause**: 
- Constraint assumed registration closes BEFORE tournament starts
- But golf tournaments accept entries until FINAL round (after event starts)
- API was using `round1_tee_time - 15min` instead of `round4_tee_time - 15min`

**Solution**:
1. Changed constraint: `registration_closes_at <= end_date` (not start_date)
2. Changed API logic: Use `round4_tee_time` (LAST round) instead of `round1_tee_time`
3. Fixed data types: Use TIMESTAMPTZ (not DATE) to allow time-of-day in constraint checks

**Files Fixed in Clubhouse**:
- `scripts/clubhouse/NUCLEAR-CLEAN-RESET.sql` (line 46) - Constraint corrected
- `scripts/clubhouse/01-create-schema.sql` (line 46) - Constraint corrected
- `scripts/clubhouse/02-clean-install.sql` (line 58) - Constraint corrected
- `apps/golf/src/app/api/clubhouse/events/route.ts` (line 173) - Use round4_tee_time
- `apps/golf/src/app/api/clubhouse/events/[id]/route.ts` (lines 143-146) - Use round4_tee_time
- `apps/golf/src/app/clubhouse/events/page.tsx` - Status badges and countdown timers
- `apps/golf/src/app/clubhouse/events/[id]/page.tsx` - Registration validation

**Validation**:
- ✅ 3-round event (Desert Classic): Closes 15min before Round 3
- ✅ 4-round event (Spring Masters): Closes 15min before Round 4
- ✅ Constraint allows registration_closes_at = end_date minus 15min
- ✅ Frontend displays accurate countdown timers

---

**Discovery**: Simple trigger design doesn't work for multi-round competitions.

Clubhouse testing revealed trigger issues:
- Simple trigger sets ALL competitions to same `closes_at` value
- But each competition needs different timing based on its `rounds_covered`
- Round 1 comp closes at `round1_tee_time - 15min`
- Round 2 comp closes at `round2_tee_time - 15min` (DIFFERENT)
- Trigger overwrites correct API-calculated timing

**Solution in Clubhouse**: API-based approach (no trigger)
- `POST /api/clubhouse/events` - Creates competitions with round-specific timing
- `PUT /api/clubhouse/events/[id]` - Updates each competition based on `rounds_covered`
- Working successfully, trigger removed 2026-01-06

### Backport to Main System

**⚠️ DO NOT backport simple trigger** - same issue would occur in InPlay.

**Option A: Round-Aware Trigger (Complex but Atomic)**
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

**Option B: API-Based Approach (Proven Working in Clubhouse)**
Use same pattern as Clubhouse - calculate timing in API route.

**Option C: Keep Current Lifecycle Manager**
If it's working, don't fix it. Test thoroughly before changing.

**Files to update:**
- `apps/admin/src/app/api/tournament-lifecycle/[id]/registration/route.ts` (if needed)

---

## Problem 3: Frontend Calculates Status Instead of Displaying It

### Current System Issue
- Database has status field
- Frontend ignores it and recalculates based on dates
- 60+ lines of logic in React component
- Different calculations in different components
- **Result**: Status badges inconsistent across pages

### Root Cause
Don't trust backend data. Every component reinvents the wheel.

### Clubhouse Fix
```typescript
// Backend API returns ready-to-display data
GET /api/clubhouse/events/[slug]
{
  "event": {
    "name": "Spring Championship",
    "status": "open",
    "display_status": "Registration Open", // Pre-calculated
    "badge_color": "green",
    "can_enter": true
  },
  "competitions": [
    {
      "name": "Full Event",
      "display_status": "Registration Open",
      "badge_color": "green",
      "can_enter": true,
      "registration_closes_in": "2 days 3 hours"
    }
  ]
}

// Frontend just displays
<Badge color={competition.badge_color}>
  {competition.display_status}
</Badge>
```

### Testing Checklist
- [ ] API returns display_status field
- [ ] Frontend never calculates status
- [ ] All pages show same status for same competition
- [ ] Status updates without frontend changes
- [ ] Edge cases handled (timezone, DST, leap seconds)

### Backport to Main System
1. Add `display_status` calculation to API routes
2. Remove all `getStatusBadge()` functions from frontend
3. Components receive ready-to-display strings
4. Test on all tournament pages

**Files to update:**
- `apps/golf/src/app/api/tournaments/[slug]/route.ts` (add display_status)
- `apps/golf/src/app/tournaments/[slug]/page.tsx` (remove lines 598-688)
- `apps/golf/src/app/tournaments/page.tsx` (simplify status logic)

---

## Problem 4: Multiple Competition Types in One Table

### Current System Issue
- `tournament_competitions` holds InPlay AND ONE 2 ONE
- Nullable foreign keys (`competition_type_id`, `rounds_covered`)
- Type guards needed everywhere
- Inner joins to exclude wrong type
- **Result**: Complex queries, easy to break

### Root Cause
Trying to be too clever with database normalization.

### Clubhouse Fix
```sql
-- One competition type = one table
-- No need for format column or type guards
CREATE TABLE clubhouse_competitions (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES clubhouse_events(id),
  name TEXT NOT NULL,
  entry_credits INTEGER NOT NULL,
  -- All fields are required, no nullable confusion
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL
);
```

### Testing Checklist
- [ ] Query competitions without type filtering
- [ ] No need for inner joins
- [ ] All foreign keys required (NOT NULL)
- [ ] Type system enforces correctness

### Backport to Main System
**Option A: Separate Tables (Clean but risky)**
```sql
CREATE TABLE inplay_competitions (...);
CREATE TABLE one2one_competitions (...);
-- Migrate data
-- Update all queries
```

**Option B: Keep One Table but Enforce Format**
```sql
-- Add constraint: exactly one type field must be set
ALTER TABLE tournament_competitions
ADD CONSTRAINT one_format_only CHECK (
  (competition_format = 'inplay' AND competition_type_id IS NOT NULL AND rounds_covered IS NULL)
  OR
  (competition_format = 'one2one' AND competition_type_id IS NULL AND rounds_covered IS NOT NULL)
);
```

**Recommendation**: Option B is safer for backport. Option A for greenfield.

---

## Problem 5: Credit/Payment Operations Not Atomic

### Current System Issue
- Check wallet balance
- Create entry
- Deduct from wallet
- **Result**: Race conditions, double-spends, partial failures

### Root Cause
Multiple database operations not in transaction.

### Clubhouse Fix
```sql
-- Single RPC function does everything atomically
CREATE OR REPLACE FUNCTION create_entry_with_payment(
  p_user_id UUID,
  p_competition_id UUID,
  p_golfer_ids UUID[],
  p_captain_id UUID,
  p_credits INTEGER
) RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_balance INTEGER;
BEGIN
  -- Check balance
  SELECT credits INTO v_balance
  FROM clubhouse_wallets
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock row
  
  IF v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Create entry
  INSERT INTO clubhouse_entries (user_id, competition_id, golfer_ids, captain_id, credits_paid)
  VALUES (p_user_id, p_competition_id, p_golfer_ids, p_captain_id, p_credits)
  RETURNING id INTO v_entry_id;
  
  -- Deduct credits
  UPDATE clubhouse_wallets
  SET credits = credits - p_credits
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO clubhouse_credit_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, -p_credits, v_balance - p_credits, 'Entry: ' || p_competition_id, v_entry_id);
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;
```

### Testing Checklist
- [ ] Entry creation succeeds, credits deducted
- [ ] Entry creation fails, credits NOT deducted
- [ ] Insufficient credits = entry fails immediately
- [ ] Concurrent requests don't double-spend
- [ ] Transaction log is accurate
- [ ] Stress test: 100 simultaneous entries

### Backport to Main System
1. Create `create_entry_with_wallet_deduction()` RPC
2. Update `/api/competitions/[id]/entries` to use RPC
3. Remove manual balance checks
4. Test on staging

**Files to update:**
- Create new SQL function in migration
- `apps/golf/src/app/api/competitions/[competitionId]/entries/route.ts`

---

## Problem 6: No Database Constraints for Business Rules

### Current System Issue
- Entry can have 0 golfers
- Can pick same golfer twice
- Captain not in team
- **Result**: Invalid data in production

### Root Cause
Validation only in frontend/API, not enforced by database.

### Clubhouse Fix
```sql
CREATE TABLE clubhouse_entries (
  id UUID PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES clubhouse_competitions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  golfer_ids UUID[] NOT NULL CHECK (array_length(golfer_ids, 1) = 6), -- Exactly 6
  captain_id UUID NOT NULL CHECK (captain_id = ANY(golfer_ids)), -- Must be in team
  
  UNIQUE(competition_id, user_id), -- One entry per user per competition
  UNIQUE(golfer_ids) -- No duplicate picks (PostgreSQL enforces)
);
```

### Testing Checklist
- [ ] Try to create entry with 5 golfers → rejected
- [ ] Try to pick golfer twice → rejected
- [ ] Try to set captain not in team → rejected
- [ ] Try to enter same competition twice → rejected
- [ ] Valid entry → succeeds

### Backport to Main System
```sql
ALTER TABLE competition_entries
ADD CONSTRAINT six_golfers CHECK (
  jsonb_array_length(picks) = 6
);

ALTER TABLE competition_entries
ADD CONSTRAINT captain_in_team CHECK (
  jsonb_extract_path_text(picks, captain_index::text, 'golfer_id') IS NOT NULL
);
```

---

## Problem 7: Manual Script Dependency

### Current System Issue
- Event dates change
- Run manual script to fix competitions
- Script might have bugs
- Script might not run
- **Result**: Data inconsistency

### Root Cause
No automatic enforcement of data integrity.

### Clubhouse Fix
Database triggers + constraints = no manual scripts needed.

### Testing Checklist
- [ ] Change event dates 50 times
- [ ] Verify competitions always correct
- [ ] Never run manual script
- [ ] No data inconsistencies after 2 weeks

### Backport to Main System
Replace all manual scripts with triggers:
- `temp-update-comps.js` → Trigger
- `fix-now.js` → Trigger
- `check-competition-timing.js` → Automated test, not manual check

---

## Implementation Order

### Phase 1: Build Clubhouse (Weeks 1-2)
1. ✅ Database schema with constraints
2. ✅ Triggers for auto-sync
3. ✅ RPC functions for atomic operations
4. ✅ Admin app (create events, grant credits)
5. ✅ User app (browse, enter, leaderboard)

### Phase 2: Test Clubhouse (Weeks 3-4)
1. Run 3 test events
2. Track all issues
3. Verify zero manual interventions needed
4. Document what works

### Phase 3: Backport Proven Fixes (Week 5)
1. Problem 1: Status constants → Main system
2. Problem 2: Timing triggers → Main system
3. Problem 3: Display status → Main system
4. Problem 5: Atomic payments → Main system
5. Problem 6: Constraints → Main system

### Phase 4: Validate in Production (Week 6)
1. Deploy to staging
2. Run test tournament
3. Monitor for issues
4. Deploy to production
5. Run real tournament

---

## Success Metrics

### Clubhouse System (Must achieve before backport)
- ✅ Zero manual scripts run in 2 weeks
- ✅ Zero "competitions disappeared" reports
- ✅ Zero payment race conditions
- ✅ Zero invalid entries in database
- ✅ Admin can change dates without breaking anything

### Main System (After backport)
- ✅ 50% reduction in support tickets
- ✅ Zero manual interventions for 1 week
- ✅ All tournaments show correct status
- ✅ No rollback needed after deployment

---

## Rollback Plans

### If Clubhouse Fix Fails
- Document what went wrong
- Don't backport that fix
- Try alternative approach
- Test again

### If Backport Breaks Main System
- Database triggers can be disabled without downtime:
  ```sql
  ALTER TABLE tournaments DISABLE TRIGGER event_timing_sync;
  ```
- Revert API changes via git
- Fall back to manual scripts temporarily
- Fix issue in clubhouse first

---

## Documentation Required

For each fix that works in clubhouse:
1. **What changed** - Exact code/SQL
2. **Why it works** - Technical explanation
3. **How to test** - Reproduction steps
4. **How to backport** - Migration guide
5. **Rollback procedure** - Emergency plan

---

## Next Steps

1. **Review this plan** - Are these the right problems to fix?
2. **Prioritize fixes** - Which ones are most critical?
3. **Start with clubhouse** - Build clean system
4. **Test thoroughly** - No shortcuts
5. **Backport proven solutions** - Only what works

---

**Philosophy: Test fixes in a clean environment before touching the fragile production system.**

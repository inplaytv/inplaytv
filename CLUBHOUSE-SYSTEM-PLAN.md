# Clubhouse System - Simplified Architecture Plan

## Current System Problems (What NOT to do)

### 1. **Status Value Chaos**
- ❌ Multiple status formats: `reg_open` vs `registration_open` vs `live`
- ❌ Database constraints don't match code
- ❌ Different files use different status values
- ❌ Status filters exclude valid data

### 2. **Competition Format Confusion**
- ❌ Two systems (InPlay + ONE 2 ONE) in one table
- ❌ Nullable foreign keys (`competition_type_id` for one, `rounds_covered` for other)
- ❌ Complex type guards to distinguish them
- ❌ Queries need inner joins to exclude wrong type

### 3. **Timing Logic Scattered**
- ❌ Registration timing calculated in 5+ different places
- ❌ Lifecycle manager doesn't actually update competitions automatically
- ❌ Frontend recalculates what backend should have stored
- ❌ No single source of truth

### 4. **Auto-Update Failures**
- ❌ HTTP fetch() calls fail silently
- ❌ Lifecycle manager saves tournament but doesn't sync competitions
- ❌ Manual scripts needed to fix data constantly
- ❌ No validation that updates succeeded

---

## Clubhouse System - Clean Architecture

### ✅ COMPLETED SO FAR

**Phase 1: Foundation (DONE)**
1. ✅ Database Schema Applied to Supabase (`scripts/clubhouse/NUCLEAR-CLEAN-RESET.sql`)
   - Tables: `clubhouse_events`, `clubhouse_competitions`, `clubhouse_wallets`, `clubhouse_credit_transactions`, `clubhouse_entries`, `clubhouse_entry_picks`
   - Correct columns: `balance_credits` (not credits), NO `rounds_covered`
   - Correct constraint: `registration_closes_at <= end_date` (not start_date)
   - Auto-status triggers: Not implemented yet
   - Credit transaction RPC functions: Not implemented yet
   - Status: **✅ DEPLOYED AND WORKING**

2. ✅ Test Data Populated (`scripts/clubhouse/populate-test-data.sql`)
   - 3 events: Spring Masters, Desert Classic, Coastal Links
   - 15 competitions total (5 per event)
   - Correct registration timing: Closes 15min before Round 4 (LAST round)
   - Status: **✅ LOADED AND VERIFIED**

3. ✅ Admin Pages Built (`apps/golf/src/app/clubhouse/admin/`)
   - Dashboard (`/clubhouse/admin`)
   - Events list (`/clubhouse/admin/events`)
   - Create event form (`/clubhouse/admin/events/create`)
   - Credits grant (`/clubhouse/admin/credits`)
   - Entries list (`/clubhouse/admin/entries`)
   - Persistent sidebar navigation ✅

4. ✅ User Pages Built (`apps/golf/src/app/clubhouse/`)
   - Landing page (`/clubhouse`)
   - Events list (`/clubhouse/events`) - **✅ WORKING**
   - Event details (`/clubhouse/events/[id]`) - **✅ WORKING**
   - Wallet page (`/clubhouse/wallet`) - **Not tested yet**

5. ✅ API Routes Created (`apps/golf/src/app/api/clubhouse/`)
   - Events CRUD (`/api/clubhouse/events`) - **✅ WORKING**
   - Credits grant (`/api/clubhouse/credits/grant`)
   - Entries (`/api/clubhouse/entries`)
   - Users list (`/api/clubhouse/users`)
   - Status: **✅ TESTED AND WORKING**

6. ✅ Navigation Updated
   - Added "Club Tournaments" link to clubhouse menu
   - Fixed credits link to `/clubhouse/wallet`

7. ✅ Team Builder Duplicated
   - Exact InPlay copy at `/clubhouse/build-team/[competitionId]`
   - Teal color scheme applied

### ✅ CRITICAL FIX COMPLETED (Jan 6, 2026)

**Registration Timing Logic Fixed**
- **Problem**: Registration was closing at tournament START (Round 1 tee-off)
- **Solution**: Registration now closes 15min before LAST round (Round 4 tee-off)
- **Why**: Multi-day tournaments accept entries throughout the event until the final round
- **Schema**: Changed constraint from `registration_closes_at <= start_date` to `<= end_date`
- **API**: Updated to use `round4_tee_time` instead of `round1_tee_time`
- **Files Fixed**:
  - `apps/golf/src/app/api/clubhouse/events/route.ts`
  - `apps/golf/src/app/api/clubhouse/events/[id]/route.ts`
  - `apps/golf/src/app/clubhouse/events/page.tsx`
  - `apps/golf/src/app/clubhouse/events/[id]/page.tsx`
  - `scripts/clubhouse/NUCLEAR-CLEAN-RESET.sql`
  - `scripts/clubhouse/01-create-schema.sql`
  - `scripts/clubhouse/02-clean-install.sql`

**Column Name Fixes**
- Wallet: `balance_credits` (NOT `credits`)
- Competition: Removed `rounds_covered` column (doesn't exist in schema)

### 🔄 NEXT STEPS (In Order)

**Step 1: Test User Flows** (IMMEDIATE)
```powershell
# Run this in PowerShell:
.\apply-clubhouse-schema.ps1
# Then paste into Supabase SQL Editor and execute
```

**Step 2: Test Admin Flow** (AFTER SCHEMA)
1. Navigate to `http://localhost:3003/clubhouse/admin/events/create`
2. Create a test event:
   - Name: "Spring Championship"
   - Entry Credits: 100
   - Max Entries: 50
   - Set dates (start tomorrow, end day after)
3. Verify event appears in events list
4. Test creating competition

**Step 3: Grant Credits to Test User** (AFTER EVENT CREATED)
1. Go to `/clubhouse/admin/credits`
2. Grant 1000 credits to your user
3. Check wallet page shows balance

**Step 4: Test User Flow** (AFTER CREDITS GRANTED)
1. Go to `/clubhouse/events`
2. Click on test event
3. Enter team builder
4. Submit entry
5. Verify credits deducted
6. Check entry appears in "My Entries"

**Step 5: Build Missing Features**
- [ ] Leaderboard page (`/clubhouse/leaderboard/[compId]`)
- [ ] My Entries page (`/clubhouse/my-entries`)
- [ ] Competition details page
- [ ] Entry withdrawal flow
- [ ] Pro shops redemption system

**Step 6: Refinements**
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Add success toasts
- [ ] Responsive design testing
- [ ] Edge case handling

### 📋 TESTING CHECKLIST

**Before Testing**:
- [ ] Database schema applied to Supabase
- [ ] Dev server running (`pnpm dev:golf`)
- [ ] Logged in as test user

**Admin Tests**:
- [ ] Create event (with auto-generated competitions)
- [ ] Edit event (verify competitions sync)
- [ ] Grant credits to user
- [ ] View entries list
- [ ] Delete test event

**User Tests**:
- [ ] Browse events list
- [ ] View event details
- [ ] Check wallet balance
- [ ] Create entry (team builder)
- [ ] Verify credits deducted
- [ ] View my entries
- [ ] Check leaderboard (when built)

**Edge Cases**:
- [ ] Insufficient credits
- [ ] Duplicate entry attempt
- [ ] Invalid golfer IDs
- [ ] Event capacity reached
- [ ] Registration closed

---

## Core Principles

1. **ONE status format everywhere** - Use simple, clear values
2. **Separate tables for different concepts** - Don't mix competition types
3. **Database does calculations** - Use PostgreSQL functions, not scattered code
4. **Timestamps over status** - Dates are source of truth, status is derived
5. **No silent failures** - Transactions or nothing

---

## Database Schema

### Tables

```sql
-- Clubhouse events (like tournaments)
CREATE TABLE clubhouse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Simple status - only 4 values
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'open', 'active', 'completed')),
  
  -- Timing (source of truth)
  registration_opens_at TIMESTAMPTZ NOT NULL,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clubhouse competitions (only ONE type)
CREATE TABLE clubhouse_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES clubhouse_events(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- "Full Event", "Round 1 Only", "Beat The Cut"
  description TEXT,
  
  -- Pricing in CREDITS (not pennies)
  entry_credits INTEGER NOT NULL,
  prize_credits INTEGER,
  
  -- Timing - COPIED from event, never calculated
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  
  -- Capacity
  max_entries INTEGER NOT NULL DEFAULT 100,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credit wallets (simpler than pennies)
CREATE TABLE clubhouse_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions (audit log)
CREATE TABLE clubhouse_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- Positive = add, negative = deduct
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID, -- entry_id or payment_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries (simplified)
CREATE TABLE clubhouse_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES clubhouse_competitions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Picks (JSON for simplicity)
  golfer_ids UUID[] NOT NULL, -- Array of 6 golfer IDs
  captain_id UUID NOT NULL, -- One of the above 6
  
  credits_paid INTEGER NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(competition_id, user_id) -- One entry per competition per user
);
```

---

## Automatic Status Management (PostgreSQL Functions)

### Function 1: Auto-update event status
```sql
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := CASE
    WHEN NOW() < NEW.registration_opens_at THEN 'upcoming'
    WHEN NOW() >= NEW.registration_opens_at AND NOW() < NEW.start_date THEN 'open'
    WHEN NOW() >= NEW.start_date AND NOW() < NEW.end_date THEN 'active'
    ELSE 'completed'
  END;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_status_auto_update
  BEFORE INSERT OR UPDATE OF registration_opens_at, start_date, end_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_status();
```

### Function 2: Competition Timing Management

**⚠️ UPDATE 2026-01-06**: Timing sync trigger removed after testing.

**Original Design** (trigger-based):
```sql
-- REMOVED - Incompatible with round-specific competition timing
-- See CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md
/*
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
*/
```

**Why Removed**: Trigger assumed all competitions share same timing, but each competition needs to close at its specific round's tee time minus 15 minutes.

**Current Implementation** (API-based):
Timing calculated in `apps/golf/src/app/api/clubhouse/events/[id]/route.ts`:
- Reads each competition's `rounds_covered` array
- Maps to corresponding `round{N}_tee_time` from event
- Calculates `closes_at` as tee time - 15min
- Updates each competition individually

**Result**: Each competition has correct round-specific timing.

### Function 3: Credit wallet updates (atomic)
```sql
CREATE OR REPLACE FUNCTION apply_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update wallet
  UPDATE clubhouse_wallets
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO clubhouse_credit_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, p_amount, v_new_balance, p_reason, p_reference_id);
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```

---

## API Routes (Simplified)

### Admin Routes
```
POST   /api/clubhouse/admin/events          - Create event (auto-creates default competitions)
PUT    /api/clubhouse/admin/events/[id]     - Update event (trigger auto-syncs competitions)
POST   /api/clubhouse/admin/credits/grant   - Grant credits to user
GET    /api/clubhouse/admin/events/[id]/entries - View all entries
```

### User Routes
```
GET    /api/clubhouse/events                 - List open events
GET    /api/clubhouse/events/[slug]          - Event detail + competitions
POST   /api/clubhouse/entries                - Create entry (deducts credits)
GET    /api/clubhouse/my-entries             - User's entries
GET    /api/clubhouse/wallet                 - User's credit balance
GET    /api/clubhouse/leaderboard/[compId]  - Competition leaderboard
```

---

## Frontend Pages

### User Pages (apps/golf/src/app/clubhouse/)
```
/clubhouse                 - Landing page
/clubhouse/events          - Browse events
/clubhouse/events/[id]     - Event detail (select competition)
/clubhouse/build-team/[eventId] - Team builder
/clubhouse/my-entries      - My active entries
/clubhouse/wallet          - Credit balance + history
/clubhouse/leaderboard/[competitionId] - Live leaderboard
/clubhouse/pro-shops       - Pro shops (future)
```

### Admin Pages (apps/admin/src/app/clubhouse/)
```
/clubhouse/events          - Manage events
/clubhouse/events/create   - Create event wizard
/clubhouse/events/[id]/edit - Edit event (auto-updates comps)
```

---

## Key Simplifications

### 1. **Single Competition Type**
- No InPlay vs ONE 2 ONE complexity
- One table, one set of rules
- Easy to understand and maintain

### 2. **Credits Not Pennies**
- Whole numbers: 100 credits, not 10000 pennies
- Easier math, clearer pricing
- No currency conversion

### 3. **Automatic Timing**
- Database triggers handle all sync
- Admin just sets event dates
- Competitions auto-update
- No lifecycle manager needed

### 4. **Simplified Status**
```
upcoming  → Registration hasn't opened yet
open      → Registration open, event not started
active    → Event in progress
completed → Event finished
```
Only 4 values. Clear progression. No confusion.

### 5. **Frontend = Display Only**
- Frontend doesn't calculate status
- Frontend doesn't check dates
- Backend sends ready-to-display data
- No complex logic in React components

### 6. **Atomic Operations**
```typescript
// Entry creation - one transaction
const entry = await createEntry({
  competition_id,
  user_id,
  golfer_ids,
  captain_id
});
// Credits deducted automatically via RPC function
// If entry fails, credits not deducted
// If credits insufficient, entry fails
```

---

## Migration Strategy

### Phase 1: Build Clubhouse (Separate)
1. Create new database schema
2. Build admin app
3. Build user app
4. Test thoroughly with real data
5. Deploy as separate system

### Phase 2: Validate & Iterate
1. Run clubhouse for 2-3 events
2. Fix any issues found
3. Document lessons learned
4. Refine API patterns

### Phase 3: Backport to InPlay (Optional)
If clubhouse system proves stable:
1. Create migration scripts
2. Duplicate wallet system
3. Simplify competition types
4. Merge status values
5. Replace scattered logic with database functions

---

## File Structure

```
apps/
  golf/src/app/
    clubhouse/            # User pages (integrated)
      page.tsx            # Landing page
      events/
        page.tsx          # Browse events
        [id]/
          page.tsx        # Event details
      build-team/
        [eventId]/
          page.tsx        # Team builder
      my-entries/
        page.tsx          # My entries
      wallet/
        page.tsx          # Credits wallet
      leaderboard/
        [competitionId]/
          page.tsx        # Live scores
      pro-shops/
        page.tsx          # Pro shops
    api/clubhouse/        # API routes
      events/
        route.ts          # List/create events
        [id]/route.ts     # Get/update event
      entries/route.ts    # Entry management
      credits/
        route.ts          # Credit balance
        grant/route.ts    # Admin grant credits
      users/route.ts      # User list
        
  admin/src/app/
    clubhouse/            # Admin pages (integrated)
      events/
        page.tsx          # Event list
        create/
          page.tsx        # Create wizard
        [id]/
          edit/
            page.tsx      # Edit event
        
scripts/clubhouse/        # Database setup
  01-create-schema.sql    # Create tables & triggers
  02-seed-data.sql        # Sample data (optional)
```

---

## Next Steps

1. **Review this plan** - Does this approach make sense?
2. **Create database schema** - Run SQL to create tables
3. **Build admin first** - Create events, grant credits
4. **Build user app** - Browse, enter, view leaderboard
5. **Test with real data** - Run actual event
6. **Document patterns** - Write guide for future devs

---

## Questions to Answer

1. Should clubhouse entries be refundable if event cancelled?
2. How many credits for typical entry? (100? 1000?)
3. Can users transfer credits to each other?
4. Leaderboard updates - real-time or polling?
5. Separate golfer database or reuse existing?

---

**This plan prioritizes stability over features. Simple, predictable, maintainable.**

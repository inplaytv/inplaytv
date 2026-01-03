# 🎯 CLUBHOUSE MASTER REFERENCE - READ THIS FIRST

> **WHEN IN DOUBT, READ THIS FILE**  
> This is the single source of truth for what we're building and why.

---

## 🚨 THE CORE PROBLEM

**InPlay keeps breaking.** Recurring issues:
1. Competitions disappear randomly (status value mismatches)
2. Manual scripts needed constantly (timing updates fail silently)
3. Race conditions in payments (non-atomic operations)
4. Invalid data in production (no database constraints)

**Why this happens:** Architecture has too many moving parts, no single source of truth, and validation only in code (not database).

---

## 🎯 THE SOLUTION

**Build Clubhouse as a TESTING GROUND**, not just a new feature.

### The Strategy (Do NOT Deviate)

```
1. Identify specific InPlay problem
2. Build clean fix in Clubhouse
3. Test for 2+ weeks with real usage
4. If bulletproof → Backport to InPlay
5. If problems → Fix in Clubhouse first, repeat
```

**Philosophy:** Test fixes in a clean environment before touching fragile production.

---

## 📋 WHAT CLUBHOUSE IS

**A simplified, credit-based fantasy golf platform** where:
- Users receive virtual credits (no money)
- Browse golf tournaments and competitions
- Build 6-golfer teams and pay entry fee in credits
- Compete against others for prizes (also in credits)

**Key Difference from InPlay:**
- ✅ Bulletproof database architecture (constraints, triggers, RPC functions)
- ✅ Single source of truth for status values
- ✅ Auto-sync timing (no manual scripts)
- ✅ Atomic operations (no race conditions)
- ✅ Database enforces business rules

---

## 🏗️ ARCHITECTURE RULES (NEVER BREAK THESE)

### Rule 1: Database is Source of Truth
- Status calculated by database trigger, not frontend
- Timing synced by database trigger, not API calls
- Constraints enforce business rules at database level

### Rule 2: All Operations Must Be Atomic
- Credit grants = RPC function (one transaction)
- Entry creation + payment = RPC function (both succeed or both fail)
- Never split related operations across API calls

### Rule 3: Single Source of Truth for Constants
- Status values defined ONCE in `clubhouse-constants.ts`
- Database CHECK constraint matches code constants
- Frontend displays what database says, never recalculates

### Rule 4: No Manual Scripts
- If you need a script to fix data → Architecture is broken
- Fix the trigger/constraint, don't add a script
- Scripts are for testing only, never for production

---

## 📁 FILE STRUCTURE & PURPOSES

```
apps/golf/src/app/clubhouse/
├── page.tsx                    # Landing page - browse events
├── admin/page.tsx              # Admin UI - grant credits, manage events
└── build-team/[slug]/page.tsx  # Team builder - select 6 golfers

apps/golf/src/app/api/clubhouse/
├── credits/route.ts            # POST: grant credits (calls RPC)
└── enter/route.ts              # POST: create entry (calls RPC)

scripts/
├── clubhouse-schema.sql        # Complete database setup
└── test-clubhouse-event.sql    # Create test event

SYSTEMATIC-FIX-PLAN.md          # Tracks progress, backport strategy
CLUBHOUSE-QUICK-START.md        # Setup & testing guide
CLUBHOUSE-MASTER-REFERENCE.md   # This file (read when lost)
```

---

## 🗄️ DATABASE SCHEMA

### Tables (5)
1. **clubhouse_events** - Golf tournaments
2. **clubhouse_competitions** - Entry types within events
3. **clubhouse_wallets** - User credit balances
4. **clubhouse_credit_transactions** - Audit log
5. **clubhouse_entries** - User teams + golfer selections

### Triggers (2)
1. **update_event_status()** - Auto-calculates status from dates
2. **sync_competition_timing()** - Auto-syncs competition dates when event changes

### RPC Functions (2)
1. **grant_credits(user_id, amount, reason)** - Atomic wallet update + transaction log
2. **create_entry_with_payment(...)** - Atomic entry creation + credit deduction

### Constraints (Critical)
```sql
-- Status can only be these 4 values
CHECK (status IN ('upcoming', 'open', 'active', 'completed'))

-- Must have exactly 6 golfers
CHECK (array_length(golfer_ids, 1) = 6)

-- Captain must be in the team
CHECK (captain_id = ANY(golfer_ids))

-- One entry per user per competition
UNIQUE (competition_id, user_id)
```

---

## ✅ CURRENT STATUS (January 1, 2026)

### ✅ Completed
- Database schema with all triggers/constraints
- Admin interface (sidebar, credit grants working)
- Landing page (shows events, credit balance)
- Build-team page (6-golfer selector, async params fixed)
- Test event "The Masters 2026" with 3 competitions
- User has 1000 credits for testing

### 🔄 Currently Testing
- **First end-to-end entry submission**
  1. Select 6 golfers
  2. Submit entry
  3. Verify atomic deduction (entry created + credits deducted)
  4. Check transaction log

### ⏳ Still TODO
- Event creation UI in admin
- Leaderboard page
- Entry management (view/cancel)
- Test failure cases (insufficient credits, duplicate entries)

---

## 🧪 TESTING STRATEGY

### What to Test Now
1. **Happy Path:** Select 6 golfers → Submit → Verify deduction
2. **Insufficient Credits:** Try entry with < 100 credits → Should fail gracefully
3. **Duplicate Entry:** Try entering same competition twice → Should reject
4. **Captain Validation:** Try entry with captain not in team → Should reject
5. **Golfer Count:** Try entry with 5 golfers → Should reject

### Success Criteria (Before Backport)
- ✅ Zero manual scripts needed for 2 weeks
- ✅ Zero "competitions disappeared" issues
- ✅ Zero race condition bugs
- ✅ Zero invalid data in database
- ✅ All operations atomic and logged

---

## 🚫 COMMON MISTAKES TO AVOID

### ❌ DON'T: Calculate Status in Frontend
```typescript
// WRONG - Frontend calculates
const status = now > opensAt ? 'open' : 'upcoming';
```

### ✅ DO: Display What Database Says
```typescript
// RIGHT - Database already calculated it
<Badge>{event.status}</Badge>
```

### ❌ DON'T: Split Related Operations
```typescript
// WRONG - Race condition possible
const entry = await createEntry(...);
await deductCredits(...);
```

### ✅ DO: Use Atomic RPC
```typescript
// RIGHT - Single transaction
await supabase.rpc('create_entry_with_payment', {...});
```

### ❌ DON'T: Add Manual Scripts
```typescript
// WRONG - Manual intervention
node scripts/fix-competition-timing.js
```

### ✅ DO: Fix the Trigger
```sql
-- RIGHT - Automatic enforcement
CREATE TRIGGER sync_competition_timing ...
```

---

## 🔄 WHEN THINGS GO WRONG

### If Entry Submission Fails
1. Check browser console for error
2. Check Supabase logs for RPC function errors
3. Verify wallet has sufficient credits
4. Test constraint violations (6 golfers? captain in team?)

### If Events Don't Show
1. Check event status in database: `SELECT * FROM clubhouse_events;`
2. Verify trigger ran: `SELECT * FROM pg_trigger WHERE tgname = 'event_status_trigger';`
3. Check query filter in `page.tsx` (should filter by status)

### If Credits Don't Deduct
1. Check if RPC function exists: `SELECT proname FROM pg_proc WHERE proname = 'create_entry_with_payment';`
2. Verify RPC called from API route
3. Check transaction log: `SELECT * FROM clubhouse_credit_transactions ORDER BY created_at DESC;`

---

## 📖 OTHER REFERENCE DOCUMENTS

**Read in This Order:**
1. **CLUBHOUSE-MASTER-REFERENCE.md** (this file) - Overall context
2. **SYSTEMATIC-FIX-PLAN.md** - Specific problems being solved
3. **CLUBHOUSE-QUICK-START.md** - Setup instructions
4. **scripts/clubhouse-schema.sql** - Database implementation

---

## 🎯 REMEMBER THE GOAL

**We're not building a new feature.**  
**We're PROVING architectural fixes work before touching InPlay.**

If you find yourself:
- Adding manual scripts → WRONG DIRECTION
- Calculating status in React → WRONG DIRECTION
- Splitting operations across API calls → WRONG DIRECTION
- Adding complex type guards → WRONG DIRECTION

**Stop. Re-read this file. Get back on track.**

---

**Last Updated:** January 1, 2026  
**Status:** Phase 1 Testing - First Entry Submission

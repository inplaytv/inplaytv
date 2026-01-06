# InPlayTV Fantasy Golf Platform - Architecture Guide

**Version:** 2.0 - Unified Competition System  
**Last Updated:** January 5, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Three Platform Architecture](#three-platform-architecture)
3. [Unified Competition System](#unified-competition-system)
4. [Clubhouse System](#clubhouse-system)
5. [Database Architecture](#database-architecture)
6. [API Patterns](#api-patterns)
7. [User Flows](#user-flows)
8. [Scoring & Calculations](#scoring--calculations)
9. [Wallet & Payments](#wallet--payments)
10. [Key Design Decisions](#key-design-decisions)
11. [Quick Reference](#quick-reference)

---

## System Overview

InPlayTV is a **real-time fantasy golf platform** built as a **Turborepo monorepo** with three Next.js applications and shared packages.

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    InPlayTV Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend:  Next.js 16 (Turbopack) + React 19               │
│  Backend:   Next.js API Routes + Supabase PostgreSQL        │
│  Payments:  Stripe + Wallet System                          │
│  External:  DataGolf API (scores, salaries, rankings)       │
│  Deploy:    Vercel + Supabase Cloud                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
inplaytv-new/
├── apps/
│   ├── golf/              ← Main player-facing game (port 3003)
│   ├── admin/             ← Tournament management (port 3002)
│   └── web/               ← Marketing site + auth (port 3000)
├── packages/
│   ├── scoring-service/   ← Provider-agnostic scoring adapter
│   └── shared/            ← Shared utilities and types
└── scripts/               ← Database migrations & diagnostics
```

**Key Commands:**
- `pnpm dev` - Run all 3 apps in parallel
- `pnpm dev:golf` - Run only golf app (most common)
- `pnpm kill:ports` - Kill stuck node processes

---

## Three Platform Architecture

The system has **THREE INDEPENDENT PLATFORMS** that must remain isolated:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   InPlay    │  │  ONE 2 ONE  │  │      Clubhouse          │ │
│  │   System    │  │   System    │  │  (Testing Ground)       │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────────┤ │
│  │ Main game   │  │ Head-to-    │  │ Test fixes before       │ │
│  │ Admin-      │  │ head        │  │ backporting to          │ │
│  │ created     │  │ challenges  │  │ main systems            │ │
│  │ comps       │  │ User-       │  │                         │ │
│  │             │  │ created     │  │ ALL tables prefixed:    │ │
│  │ Tables:     │  │             │  │ clubhouse_*             │ │
│  │ tournament_ │  │ Same tables │  │                         │ │
│  │ competitions│  │ as InPlay   │  │ clubhouse_events        │ │
│  │             │  │ (unified)   │  │ clubhouse_competitions  │ │
│  │             │  │             │  │ clubhouse_entries       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

         ↓                    ↓                      ↓
    /tournaments/        /one-2-one/           /clubhouse/
```

### Platform Characteristics

| Feature | InPlay | ONE 2 ONE | Clubhouse |
|---------|--------|-----------|-----------|
| **Tables** | `tournament_competitions` | `tournament_competitions` | `clubhouse_*` |
| **Entry Link** | `competition_id` | `competition_id` | `competition_id` |
| **Format Field** | `'inplay'` | `'one2one'` | N/A (separate tables) |
| **Creation** | Admin creates | User triggers | Admin creates |
| **Players** | 50-1000 | Exactly 2 | Any cap |
| **URL Pattern** | `/tournaments/[slug]` | `/one-2-one/[slug]` | `/clubhouse/events/[id]` |
| **Purpose** | Production game | Production challenges | Testing & staging |

### ⚠️ CRITICAL ISOLATION RULES

1. **NEVER** modify InPlay when working on Clubhouse
2. **NEVER** modify ONE 2 ONE when working on Clubhouse  
3. **ALWAYS** check PRE-CHANGE-CHECKLIST.md before changes
4. **ALWAYS** test fixes in Clubhouse first, then backport

---

## Unified Competition System

### 🚨 THE BIG CHANGE: One Table for Everything

**Previously:** Two separate tables (`tournament_competitions` + `competition_instances`)  
**Now:** ONE unified table (`tournament_competitions`) for both InPlay and ONE 2 ONE

```sql
tournament_competitions {
  id                         UUID PRIMARY KEY
  tournament_id              UUID REFERENCES tournaments
  competition_format         TEXT ('inplay' | 'one2one')  ← ONLY way to distinguish
  competition_type_id        UUID (NOT NULL for InPlay, NULL for ONE 2 ONE)
  template_id                UUID (NULL for InPlay, NOT NULL for ONE 2 ONE)
  rounds_covered             INTEGER[] (NULL for InPlay, REQUIRED for ONE 2 ONE)
  instance_number            INTEGER (always 1 for InPlay, increments for ONE 2 ONE)
  status                     TEXT
  current_players            INTEGER
  max_players                INTEGER
  entry_fee_pennies          INTEGER
  reg_close_at               TIMESTAMP
  start_at                   TIMESTAMP
  end_at                     TIMESTAMP
  assigned_golfer_group_id   UUID
  -- ... other fields
}
```

### How to Distinguish Competition Types

**❌ OLD WAY (Broken):**
```typescript
if (item.competition_id) return 'inplay';
if (item.instance_id) return 'one2one';  // Column doesn't exist!
```

**✅ NEW WAY (Correct):**
```typescript
if (item.competition_format === 'inplay') return 'inplay';
if (item.competition_format === 'one2one') return 'one2one';
```

### Entry Linking

**Both types use the SAME entry table:**

```sql
competition_entries {
  id               UUID PRIMARY KEY
  user_id          UUID REFERENCES profiles
  competition_id   UUID REFERENCES tournament_competitions  ← ONLY this column
  entry_name       TEXT
  captain_golfer_id UUID
  status           TEXT
  entry_fee_paid   INTEGER
  -- ... other fields
}

-- NO instance_id column!
-- Constraint enforces: competition_id must be NOT NULL
```

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  tournament_competitions                      │
│                      (UNIFIED TABLE)                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │   InPlay Records   │         │  ONE 2 ONE Records │     │
│  ├────────────────────┤         ├────────────────────┤     │
│  │ competition_format │         │ competition_format │     │
│  │   = 'inplay'       │         │   = 'one2one'      │     │
│  │                    │         │                    │     │
│  │ competition_type_id│         │ template_id        │     │
│  │   NOT NULL         │         │   NOT NULL         │     │
│  │                    │         │                    │     │
│  │ rounds_covered     │         │ rounds_covered     │     │
│  │   NULL (optional)  │         │   REQUIRED         │     │
│  │                    │         │                    │     │
│  │ max_players:       │         │ max_players:       │     │
│  │   50-1000          │         │   2 (fixed)        │     │
│  └────────────────────┘         └────────────────────┘     │
│           │                              │                  │
│           └──────────────┬───────────────┘                  │
│                          ↓                                  │
│                competition_entries                          │
│                  (SHARED TABLE)                             │
│              competition_id → id                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Clubhouse System

The **Clubhouse System** is a **clean-slate testing ground** for new patterns before backporting to InPlay/ONE 2 ONE. It follows the SYSTEMATIC-FIX-PLAN.md strategy:

1. ✅ Identify problems in current systems
2. ✅ Fix in Clubhouse (clean implementation)
3. ⏸️ Test thoroughly with real data (2-3 events)
4. ⏸️ Validate bulletproof
5. ⏸️ Backport proven solution to InPlay/ONE 2 ONE

### Why Clubhouse Exists

**Problems in InPlay/ONE 2 ONE:**
- ❌ Status value inconsistency (`reg_open` vs `registration_open`)
- ❌ Timing logic scattered across multiple files
- ❌ HTTP fetch() calls fail silently
- ❌ Frontend recalculates status (don't trust backend)
- ❌ Manual scripts needed to fix data

**Clubhouse Solutions:**
- ✅ Simple status values (4 only: `upcoming`, `open`, `active`, `completed`)
- ✅ Database triggers auto-update status (⚠️ timing managed by API - see CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md)
- ✅ Automatic status calculation
- ✅ Credits system (simpler than penny-based wallet)
- ✅ Complete table isolation (no shared tables)

### Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    CLUBHOUSE SYSTEM                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  clubhouse_events (like tournaments)                           │
│         ↓                                                      │
│  clubhouse_competitions (1 type per event, not mixed)          │
│         ↓                                                      │
│  clubhouse_entries (user team submissions)                     │
│         ↓                                                      │
│  clubhouse_wallets + clubhouse_credit_transactions             │
│                                                                │
│  ALL tables prefixed with clubhouse_*                          │
│  NO references to tournament_competitions                      │
│  NO references to wallets/wallet_transactions                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Database Schema

**Schema File:** `scripts/clubhouse/01-create-schema.sql` (416 lines)

#### Events Table
```sql
CREATE TABLE clubhouse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Event dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Round tee times (for competition scheduling)
  round1_tee_time TIMESTAMPTZ,
  round2_tee_time TIMESTAMPTZ,
  round3_tee_time TIMESTAMPTZ,
  round4_tee_time TIMESTAMPTZ,
  
  -- Registration timing (source of truth)
  registration_opens_at TIMESTAMPTZ NOT NULL,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  
  -- Optional link to InPlay tournament for golfer sync (Option A)
  linked_tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  
  -- Status (auto-calculated by trigger) ← KEY FEATURE
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'open', 'active', 'completed')),
  
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status Calculation Trigger:**
```sql
CREATE OR REPLACE FUNCTION update_clubhouse_event_status()
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

CREATE TRIGGER clubhouse_event_status_auto_update
  BEFORE INSERT OR UPDATE OF registration_opens_at, start_date, end_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION update_clubhouse_event_status();
```

**Benefits:**
- ✅ Status ALWAYS accurate (database enforces)
- ✅ Frontend never calculates status (just displays)
- ✅ No inconsistency possible
- ✅ Timezone-safe

#### Competitions Table
```sql
CREATE TABLE clubhouse_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES clubhouse_events(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,  -- "Full Event", "Round 1 Only", "Beat The Cut"
  description TEXT,
  
  -- Which rounds this competition covers
  rounds_covered INTEGER[] NOT NULL,  -- [1,2,3,4] or [1] or [2]
  
  -- Pricing in CREDITS (not pennies!)
  entry_credits INTEGER NOT NULL CHECK (entry_credits >= 0),
  prize_credits INTEGER CHECK (prize_credits >= 0),
  
  -- Capacity
  max_entries INTEGER NOT NULL DEFAULT 100 CHECK (max_entries > 0),
  
  -- Golfer group (which golfers can be selected)
  assigned_golfer_group_id UUID REFERENCES golfer_groups(id) ON DELETE SET NULL,
  
  -- Timing (calculated by API based on rounds_covered) ← ROUND-SPECIFIC
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Timing Sync - API-Based Approach:**

⚠️ **Note**: Originally designed with database trigger (see git history), but testing revealed incompatibility with round-specific competition timing. Trigger removed 2026-01-06.

**Why Trigger Didn't Work:**
- Trigger assumed all competitions share same timing
- Reality: Each event has 5 competitions (All Rounds, Round 1, Round 2, Round 3, Round 4)
- Each competition needs to close at its specific round's tee time - 15min
- Trigger would overwrite all competitions with same `registration_closes_at` value

**Current Implementation:**
Timing calculated in API routes based on `rounds_covered`:
- `apps/golf/src/app/api/clubhouse/events/route.ts` (POST - create)
- `apps/golf/src/app/api/clubhouse/events/[id]/route.ts` (PUT - update)

Each competition's timing is calculated from its first round:
```typescript
const firstRound = competition.rounds_covered[0]; // e.g., 2 for "Round 2"
const roundTeeTime = event[`round${firstRound}_tee_time`];
const closesAt = roundTeeTime - 15 minutes;
const startsAt = roundTeeTime;
```

**Benefits:**
- ✅ Correct round-specific timing for each competition
- ✅ Flexible - can handle different round combinations
- ✅ Debuggable TypeScript instead of SQL
- ✅ Tested and proven working

See: [CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md](CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md)

#### Wallet System (Credits)
```sql
CREATE TABLE clubhouse_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clubhouse_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,  -- Positive = add, negative = deduct
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  reference_id UUID,  -- entry_id, payment_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Why Credits Instead of Pennies:**
- ✅ Simpler math (no decimal conversions)
- ✅ Easier to understand (100 credits = entry, not 10000 pennies)
- ✅ Less error-prone (no rounding issues)
- ✅ Better UX (users see "100 credits" not "$1.00")

**Apply Credits Function (Atomic):**
```sql
CREATE OR REPLACE FUNCTION apply_clubhouse_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update wallet with row lock
  UPDATE clubhouse_wallets
  SET 
    credits = credits + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO clubhouse_credit_transactions (
    user_id, amount, balance_after, reason, reference_id
  ) VALUES (
    p_user_id, p_amount, v_new_balance, p_reason, p_reference_id
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```

#### Entries Table
```sql
CREATE TABLE clubhouse_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES clubhouse_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Picks (using tournament_golfers for validation)
  golfer_ids UUID[] NOT NULL,
  captain_id UUID NOT NULL,
  
  -- Payment
  credits_paid INTEGER NOT NULL CHECK (credits_paid >= 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation constraints
  CONSTRAINT six_golfers CHECK (array_length(golfer_ids, 1) = 6),
  CONSTRAINT captain_in_team CHECK (captain_id = ANY(golfer_ids)),
  CONSTRAINT unique_entry_per_user UNIQUE(competition_id, user_id)
);
```

### Key Features Tested in Clubhouse

#### 1. Status Auto-Calculation
**InPlay Problem:** Frontend recalculates status, inconsistent across pages  
**Clubhouse Solution:** Database trigger calculates, frontend just displays

```typescript
// ❌ OLD WAY (InPlay) - Frontend calculates
function getCompetitionStatus(competition: Competition) {
  const now = new Date();
  const regOpen = new Date(competition.reg_open_at);
  const regClose = new Date(competition.reg_close_at);
  const start = new Date(competition.start_at);
  
  if (now < regOpen) return 'upcoming';
  if (now >= regOpen && now < regClose) return 'registration_open';
  if (now >= start) return 'live';
  return 'completed';
}

// ✅ NEW WAY (Clubhouse) - Database calculates, frontend displays
function EventCard({ event }: { event: Event }) {
  return <Badge color={event.status === 'open' ? 'green' : 'gray'}>
    {event.status}
  </Badge>;
}
```

#### 2. Timing Management
**InPlay Problem:** Lifecycle manager saves tournament, HTTP fetch fails, competitions show wrong dates  
**Clubhouse Solution:** API-based calculation with round-specific timing (trigger approach removed - incompatible with multi-round competitions, see CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md)

```sql
-- InPlay (current): Separate HTTP call can fail
UPDATE tournaments SET registration_opens_at = '2026-01-10 12:00:00';
-- Then separate HTTP fetch() to /api/tournaments/[id]/competitions/sync
-- ❌ Fetch can timeout, network error, etc.

-- Clubhouse (new): Database trigger handles it
UPDATE clubhouse_events SET registration_opens_at = '2026-01-10 12:00:00';
-- ✅ Trigger AUTOMATICALLY updates all competitions in SAME transaction
```

#### 3. Credits Instead of Pennies
**InPlay Problem:** Wallet uses pennies, requires conversion everywhere  
**Clubhouse Solution:** Credits are whole numbers, no conversion

```typescript
// ❌ OLD WAY (InPlay) - Penny conversions everywhere
const entryFeePennies = competitionType.entry_fee_pennies;
const userBalancePennies = wallet.balance_cents;
const entryFeeDollars = entryFeePennies / 100;
const displayBalance = `$${(userBalancePennies / 100).toFixed(2)}`;

// ✅ NEW WAY (Clubhouse) - Direct credits
const entryFeeCredits = competition.entry_credits;
const userBalanceCredits = wallet.credits;
const displayBalance = `${userBalanceCredits} credits`;
```

#### 4. Simple Status Values
**InPlay Problem:** Multiple status formats (`reg_open`, `registration_open`, `in-play`)  
**Clubhouse Solution:** 4 values only, enforced by database constraint

```typescript
// ❌ OLD WAY (InPlay) - Multiple type definitions
export type CompetitionStatus = 'upcoming' | 'reg_open' | 'live' | 'completed' | 'cancelled';
export type TournamentStatus = 'upcoming' | 'registration_open' | 'live' | 'completed' | 'cancelled';
export type ChallengeStatus = 'pending' | 'open' | 'in-play' | 'completed' | 'cancelled';

// Frontend checks:
if (status === 'registration_open' || status === 'reg_open') { ... }

// ✅ NEW WAY (Clubhouse) - ONE type definition
export type EventStatus = 'upcoming' | 'open' | 'active' | 'completed';

// Database enforces:
CHECK (status IN ('upcoming', 'open', 'active', 'completed'))

// Frontend checks:
if (event.status === 'open') { ... }
```

### DataGolf Integration (Option A: Tournament Linking)

**Concept:** Clubhouse events can **link** to existing InPlay tournaments to inherit golfer data.

```
┌─────────────────────────────────────────────────────────────┐
│                  DataGolf Sync Workflow                      │
└─────────────────────────────────────────────────────────────┘

Step 1: Admin creates InPlay tournament
  ↓
  tournaments.id = 'abc-123'

Step 2: Admin creates Clubhouse event with link
  ↓
  clubhouse_events {
    linked_tournament_id = 'abc-123'  ← Links to InPlay
  }

Step 3: Admin syncs InPlay tournament from DataGolf
  ↓
  golfer_groups.id = 'xyz-789'  (156 golfers)
  
Step 4: Backend auto-assigns group to Clubhouse competitions
  ↓
  clubhouse_competitions {
    assigned_golfer_group_id = 'xyz-789'  ← Auto-assigned
  }

Step 5: User builds team
  ↓
  Team builder fetches golfers from group 'xyz-789'
  ✅ All DataGolf data available (salaries, rankings, etc.)
```

**Implementation Status:**
- ✅ Schema supports `linked_tournament_id` column
- ✅ API routes handle linking field
- ⏸️ Auto-assign logic not yet implemented (future enhancement)
- ✅ Manual workflow works (admin can assign group manually)

### File Structure

```
apps/golf/src/
├── app/
│   ├── clubhouse/
│   │   ├── page.tsx                          # Landing page
│   │   ├── events/
│   │   │   ├── page.tsx                      # Events list
│   │   │   └── [id]/
│   │   │       └── page.tsx                  # Event details
│   │   ├── wallet/
│   │   │   └── page.tsx                      # User credits balance
│   │   ├── build-team/
│   │   │   └── [competitionId]/
│   │   │       └── page.tsx                  # Team builder (duplicated from InPlay)
│   │   └── admin/
│   │       ├── page.tsx                      # Admin dashboard
│   │       ├── events/
│   │       │   ├── page.tsx                  # Events management
│   │       │   └── create/
│   │       │       └── page.tsx              # Create event form
│   │       ├── credits/
│   │       │   └── page.tsx                  # Grant credits
│   │       └── entries/
│   │           └── page.tsx                  # View all entries
│   │
│   └── api/
│       └── clubhouse/
│           ├── events/
│           │   ├── route.ts                  # List events, create event
│           │   └── [id]/
│           │       └── route.ts              # Get/update/delete event
│           ├── credits/
│           │   └── grant/
│           │       └── route.ts              # Admin grant credits
│           ├── entries/
│           │   └── route.ts                  # Create entry, list entries
│           └── users/
│               └── route.ts                  # List users for admin
│
└── scripts/
    └── clubhouse/
        ├── 01-create-schema.sql              # Complete database schema
        ├── ARCHITECTURE-DIAGRAM.txt          # Visual diagrams
        └── apply-clubhouse-schema.ps1        # Deploy script

docs/ (root)
├── SYSTEMATIC-FIX-PLAN.md                    # Overall strategy
├── CLUBHOUSE-SYSTEM-PLAN.md                  # Detailed plan
└── PRE-CHANGE-CHECKLIST.md                   # Safety checklist
```

### Status & Next Steps

**Current Status:** ⚠️ Ready for testing, schema not yet deployed

**Completed:**
- ✅ Database schema designed and written
- ✅ Admin pages built (events, credits, entries)
- ✅ User pages built (landing, events, wallet)
- ✅ API routes created and tested locally
- ✅ Team builder duplicated from InPlay
- ✅ Navigation links added

**Blocked:**
- ⏸️ Schema not applied to Supabase (requires manual SQL paste)

**Next Steps:**
1. Deploy schema: Run `scripts/clubhouse/01-create-schema.sql` in Supabase SQL Editor
2. Test admin flow: Create event with competitions
3. Grant credits: Give test user credits
4. Test user flow: Build team and submit entry
5. Validate patterns: Test 2-3 events to ensure bulletproof
6. Backport to InPlay: Migrate proven patterns to main system

**Testing Checklist:** See CLUBHOUSE-SYSTEM-PLAN.md lines 100-165

---

## Database Architecture

### Core Tables & Relationships

```
tournaments
    ↓ (has many)
tournament_golfers ←→ golfers
    ↓ (grouped into)
golfer_groups → golfer_group_members
    ↓ (assigned to)
tournament_competitions (InPlay + ONE 2 ONE unified)
    ↓ (receives)
competition_entries
    ↓ (contains)
entry_picks → golfers
```

### Key Tables

**1. Tournaments**
```sql
tournaments {
  id, name, slug, status
  start_date, end_date
  round_1_start, round_2_start, round_3_start, round_4_start
  registration_opens_at, registration_closes_at
  location, course_details
}
```

**2. Tournament Golfers (Junction Table)**
```sql
tournament_golfers {
  tournament_id     → tournaments.id
  golfer_id         → golfers.id
  status            TEXT ('confirmed', 'withdrawn', 'cut')
  salary            INTEGER (DataGolf provides)
  projected_score   NUMERIC
}
```

**3. Golfer Groups (Restrict Available Golfers)**
```sql
golfer_groups {
  id, name, description
  tournament_id  → tournaments.id
}

golfer_group_members {
  group_id   → golfer_groups.id
  golfer_id  → golfers.id
}
```

**4. Competition Types (InPlay Only)**
```sql
competition_types {
  id, name, slug
  description
  team_size, salary_cap
  scoring_system
}
-- Examples: 'Full Course', 'Beat The Cut', 'Weekend Warrior'
```

**5. Competition Templates (ONE 2 ONE Only)**
```sql
competition_templates {
  id, name, short_name
  rounds_covered        INTEGER[] (e.g., [1], [1,2], [1,2,3,4])
  reg_close_round       INTEGER
  entry_fee_pennies     INTEGER
  admin_fee_percent     INTEGER
  status                TEXT ('active', 'inactive')
}
-- Examples: 'Round 1', 'Weekend', 'Full Tournament'
```

**6. Unified Competitions Table**
```sql
tournament_competitions {
  id                         UUID PRIMARY KEY
  tournament_id              → tournaments.id
  competition_format         TEXT ('inplay' | 'one2one')
  
  -- InPlay fields:
  competition_type_id        → competition_types.id (NULL for ONE 2 ONE)
  
  -- ONE 2 ONE fields:
  template_id                → competition_templates.id (NULL for InPlay)
  instance_number            INTEGER (increments for each challenge)
  
  -- Shared fields:
  status                     TEXT
  current_players            INTEGER
  max_players                INTEGER
  entry_fee_pennies          INTEGER
  reg_close_at               TIMESTAMP
  start_at                   TIMESTAMP
  end_at                     TIMESTAMP
  assigned_golfer_group_id   → golfer_groups.id
  rounds_covered             INTEGER[]
}
```

**7. Entries**
```sql
competition_entries {
  id                   UUID PRIMARY KEY
  user_id              → profiles.id
  competition_id       → tournament_competitions.id
  entry_name           TEXT
  total_salary         INTEGER
  entry_fee_paid       INTEGER
  captain_golfer_id    → golfers.id
  status               TEXT ('draft', 'submitted', 'paid', 'cancelled')
  created_at, updated_at, submitted_at
}
```

**8. Entry Picks**
```sql
entry_picks {
  id            UUID PRIMARY KEY
  entry_id      → competition_entries.id
  golfer_id     → golfers.id
  salary_at_pick INTEGER (locked at entry time)
  is_captain     BOOLEAN (derived from entry.captain_golfer_id)
}
```

### Database Triggers

**Auto-Update Player Counts:**
```sql
-- When entry created → increment competition.current_players
-- When entry deleted → decrement competition.current_players
-- When competition reaches max_players → set status = 'full'
-- For ONE 2 ONE: When full → auto-spawn next instance
```

---

## API Patterns

### Supabase Client Types

**Three distinct clients - NEVER MIX:**

```typescript
// 1. Browser Client (Client Components)
import { createClient } from '@/lib/supabaseClient';
const supabase = createClient(); // Uses NEXT_PUBLIC_SUPABASE_ANON_KEY

// 2. Server Client (API Routes, Server Components)
import { createServerClient } from '@/lib/supabaseServer';
const supabase = await createServerClient(); // HTTP-only cookies, inherits user session

// 3. Admin Client (Admin Operations - bypasses RLS)
import { createAdminClient } from '@/lib/supabaseAdminServer';
const supabaseAdmin = createAdminClient(); // Uses SUPABASE_SERVICE_ROLE_KEY
```

### API Route Structure

**All API routes follow this pattern:**

```typescript
// apps/golf/src/app/api/[endpoint]/route.ts

export const dynamic = 'force-dynamic'; // Required for real-time data

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  
  // 1. Authenticate user
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Query data (RLS applies)
  const { data, error: queryError } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', user.id);
  
  // 3. Return response
  return NextResponse.json({ data });
}
```

### Query Patterns for Unified System

**InPlay Competitions:**
```typescript
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('competition_format', 'inplay')
  .eq('tournament_id', tournamentId)
  .not('competition_type_id', 'is', null);
```

**ONE 2 ONE Competitions:**
```typescript
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('competition_format', 'one2one')
  .eq('tournament_id', tournamentId)
  .not('template_id', 'is', null);
```

**User's Entries (Both Types):**
```typescript
const { data } = await supabase
  .from('competition_entries')
  .select(`
    *,
    competition:competition_id (
      *,
      tournament:tournament_id (name, slug)
    )
  `)
  .eq('user_id', userId);

// Then filter client-side:
const inplayEntries = data.filter(e => e.competition.competition_format === 'inplay');
const one2oneEntries = data.filter(e => e.competition.competition_format === 'one2one');
```

---

## User Flows

### InPlay Competition Flow

```
1. ADMIN: Create Tournament
   └─→ Set tournament dates
   └─→ Sync DataGolf field (golfers + salaries)
   └─→ Create golfer group
   └─→ Set registration window

2. ADMIN: Create InPlay Competition
   └─→ Select competition type (Full Course, Beat The Cut, etc.)
   └─→ Assign golfer group
   └─→ Set entry fee & player cap
   └─→ Status: 'draft' → 'reg_open'

3. USER: Browse Tournaments
   └─→ View /tournaments page
   └─→ Click tournament slug
   └─→ See available competitions

4. USER: Build Team
   └─→ Click "Enter Competition"
   └─→ Select 6 golfers within salary cap
   └─→ Choose captain (2x points)
   └─→ Name team

5. USER: Purchase Entry
   └─→ Review team & fee
   └─→ Wallet deduction via wallet_apply() RPC
   └─→ Entry created with status: 'paid'

6. SYSTEM: Competition Goes Live
   └─→ Status: 'reg_open' → 'live'
   └─→ DataGolf scoring updates every 5 mins
   └─→ Leaderboard updates in real-time

7. USER: View Results
   └─→ Leaderboard shows final standings
   └─→ Winners determined
   └─→ Status: 'live' → 'completed'
```

### ONE 2 ONE Challenge Flow

```
1. USER A: Create Challenge
   └─→ Select tournament
   └─→ Choose template (e.g., "Round 1 Only")
   └─→ System creates NEW tournament_competitions record:
       - competition_format: 'one2one'
       - status: 'pending'
       - instance_number: 1
       - max_players: 2
       - current_players: 0

2. USER A: Build Team
   └─→ Select 6 golfers + captain
   └─→ Click "Purchase Scorecard"
   └─→ API: /api/one-2-one/instances/[id]/activate
       - status: 'pending' → 'open'
       - current_players: 0 → 1

3. USER A: Submit Entry
   └─→ Wallet deduction
   └─→ Entry created with competition_id
   └─→ Challenge now visible on Challenge Board

4. USER B: Accept Challenge
   └─→ Browse /one-2-one/[tournament-slug]
   └─→ See User A's challenge
   └─→ Click "Accept Challenge"
   └─→ API: /api/one-2-one/instances/[id]/join

5. USER B: Build Team
   └─→ Select own 6 golfers + captain
   └─→ Submit entry
   └─→ current_players: 1 → 2
   └─→ status: 'open' → 'full'

6. SYSTEM: Auto-Spawn Next Instance
   └─→ Database trigger creates NEW competition:
       - Same template_id
       - instance_number: 2
       - status: 'pending'
       - Ready for next challenge

7. SYSTEM: Scoring & Winner
   └─→ DataGolf updates scores
   └─→ Winner determined by total points
   └─→ winner_entry_id set
   └─→ status: 'full' → 'completed'
```

### Refund Flow (ONE 2 ONE)

```
AUTOMATIC REFUNDS - No Admin Action Required

Cron Job: /api/one-2-one/cron/cancel-unfilled
Runs: Every hour

1. Find Unfilled Challenges
   └─→ status = 'open'
   └─→ current_players < 2
   └─→ reg_close_at < NOW

2. Cancel Competition
   └─→ status: 'open' → 'cancelled'
   └─→ cancellation_reason: "Registration closed without opponent"

3. Refund Each Player
   └─→ Get all entries for competition
   └─→ For each entry:
       └─→ Call wallet_apply() RPC:
           - change_cents: +entry_fee_paid
           - reason: "Refund: ONE 2 ONE challenge cancelled"
       └─→ Update entry status: 'paid' → 'cancelled'

4. Notification (Future)
   └─→ Email user about refund
   └─→ In-app notification
```

---

## Scoring & Calculations

### DataGolf Integration

**Provider-Agnostic Design:**
```
packages/scoring-service/
├── ScoringAdapter (interface)
├── DataGolfAdapter (current implementation)
└── Future: SportsRadarAdapter, etc.
```

**DataGolf Endpoints Used:**
```typescript
// Field Sync (before tournament)
GET /field-updates?tour=pga&key={API_KEY}
→ Returns: golfers, salaries, ranks

// Live Scoring (during tournament)
GET /historical-raw-data/event-id?tour=pga&key={API_KEY}
→ Returns: round scores, positions, statuses

// Rankings
GET /rankings?tour=pga&key={API_KEY}
→ Returns: OWGR rankings
```

**Sync Schedule:**
- **Pre-Tournament:** Admin syncs field → Updates `tournament_golfers` salaries
- **Live Tournament:** Every 5 minutes → API: `/api/fantasy/calculate-scores`
- **Post-Round:** Rankings sync → Updates `golfers.world_ranking`

### Points Calculation

**Standard Scoring:**
```typescript
const basePoints = calculatePointsForRound(golferScore, parScore);
const captainMultiplier = isCaptain ? 2 : 1;
const totalPoints = basePoints * captainMultiplier;
```

**Example:**
- Golfer shoots -3 (under par) = 30 points
- Captain bonus: 30 × 2 = 60 points
- Team total: Sum of all 6 golfers' points

---

## Wallet & Payments

### Wallet System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Wallet System                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  wallets                                               │
│  ├── user_id (PRIMARY KEY)                           │
│  └── balance_cents (INTEGER)                         │
│                                                        │
│  wallet_transactions (IMMUTABLE AUDIT LOG)            │
│  ├── user_id                                          │
│  ├── amount_cents (+ for credit, - for debit)        │
│  ├── transaction_type                                 │
│  ├── description                                      │
│  ├── related_entry_id                                 │
│  └── balance_after_cents                             │
│                                                        │
│  wallet_external_payments (Stripe/Demo Tracking)      │
│  ├── user_id                                          │
│  ├── provider ('stripe' | 'demo')                    │
│  ├── provider_payment_id (UNIQUE - idempotency)      │
│  ├── amount_cents                                     │
│  └── status                                           │
│                                                        │
└────────────────────────────────────────────────────────┘

ALL CHANGES GO THROUGH:  wallet_apply() RPC Function
```

### 🚨 CRITICAL: All Balance Changes Use RPC

**❌ NEVER do this:**
```typescript
// WRONG - Direct wallet update bypasses audit trail!
await supabase
  .from('wallets')
  .update({ balance_cents: newBalance })
  .eq('user_id', userId);
```

**✅ ALWAYS use wallet_apply():**
```typescript
// CORRECT - Atomic with full audit trail
const { data: newBalance, error } = await supabase.rpc('wallet_apply', {
  change_cents: 5000,  // Positive = credit, Negative = debit
  reason: 'Top-up: Stripe payment',
  target_user_id: userId  // Optional, defaults to auth.uid()
});
```

### Payment Flows

**1. Stripe Top-Up:**
```
User clicks "Top Up" → /api/stripe/create-checkout-session
    ↓
Redirect to Stripe Checkout (or demo modal if no keys)
    ↓
Payment successful → Stripe webhook → /api/stripe/webhook
    ↓
Verify signature → wallet_apply(amount, 'topup:stripe')
    ↓
Record in wallet_external_payments (provider='stripe')
```

**2. Entry Purchase:**
```
User submits entry → /api/competitions/[id]/entries
    ↓
Check wallet balance sufficient
    ↓
Call wallet_apply(-entryFee, 'Entry: Competition Name')
    ↓
IF success → Create competition_entries record
IF fail → Return 402 Insufficient Funds
```

**3. Refund (ONE 2 ONE):**
```
Cron job finds unfilled challenge
    ↓
For each entry → wallet_apply(+entryFee, 'Refund: Challenge cancelled')
    ↓
Update entry status to 'cancelled'
```

### Demo Mode

**When Stripe keys missing or `NEXT_PUBLIC_STRIPE_ENABLED=false`:**
- Top-up button shows demo modal instead of Stripe
- User simulates payment with `/api/stripe/demo-simulate`
- Records in `wallet_external_payments` with `provider='demo'`
- Perfect for QA/staging without real Stripe

---

## Key Design Decisions

### 1. Why Unified Competition System?

**Problem:** Duplicate code, confusing two-table system, different queries for InPlay vs ONE 2 ONE

**Solution:** One table (`tournament_competitions`) with `competition_format` field

**Benefits:**
- ✅ Simpler queries
- ✅ Consistent entry linking
- ✅ No more `instance_id` confusion
- ✅ Easier to add new competition formats

### 2. Why Separate Clubhouse System?

**Problem:** Testing fixes in production is risky

**Solution:** Complete isolation with `clubhouse_*` prefixed tables

**Benefits:**
- ✅ Test fixes without breaking InPlay/ONE 2 ONE
- ✅ Prove solutions work before backporting
- ✅ Rapid iteration without production impact

### 3. Why wallet_apply() RPC?

**Problem:** Race conditions in balance updates, missing audit trails

**Solution:** Server-side atomic function with transaction logging

**Benefits:**
- ✅ Atomicity (balance + transaction in one operation)
- ✅ Complete audit trail
- ✅ Race condition prevention
- ✅ Immutable transaction history

### 4. Why Provider-Agnostic Scoring?

**Problem:** DataGolf API may change or need replacement

**Solution:** Scoring service package with adapter pattern

**Benefits:**
- ✅ Easy to swap providers (DataGolf → SportsRadar)
- ✅ Consistent internal data format
- ✅ Retry logic centralized
- ✅ Test without external API

### 5. Why Three Supabase Clients?

**Problem:** Security (exposing service role key) and auth context

**Solution:** Separate clients for browser, server, and admin

**Benefits:**
- ✅ Browser client never has service role key
- ✅ Server client inherits user auth automatically
- ✅ Admin client for privileged operations only
- ✅ Row-Level Security (RLS) enforced where needed

---

## Quick Reference

### Common Queries

**Get InPlay Competitions for Tournament:**
```typescript
const { data } = await supabase
  .from('tournament_competitions')
  .select('*, tournament:tournament_id(*), competition_type:competition_type_id(*)')
  .eq('tournament_id', tournamentId)
  .eq('competition_format', 'inplay');
```

**Get User's ONE 2 ONE Matches:**
```typescript
const { data } = await supabase
  .from('competition_entries')
  .select('*, competition:competition_id(*)')
  .eq('user_id', userId)
  .eq('competition.competition_format', 'one2one');
```

**Create Entry (Both Types):**
```typescript
// 1. Deduct wallet
const { error: walletError } = await supabase.rpc('wallet_apply', {
  change_cents: -entryFeePennies,
  reason: `Entry: ${competitionName}`
});

// 2. Create entry
const { data: entry } = await supabase
  .from('competition_entries')
  .insert({
    user_id: userId,
    competition_id: competitionId,  // Works for both InPlay and ONE 2 ONE
    entry_name: 'My Team',
    // ...
  });
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only!

# DataGolf
DATAGOLF_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=      # pk_test_...
STRIPE_SECRET_KEY=                  # sk_test_... (Server-only!)
STRIPE_WEBHOOK_SECRET=

# Site
NEXT_PUBLIC_SITE_URL=               # http://localhost:3003 or production
NEXT_PUBLIC_STRIPE_ENABLED=         # Optional: 'false' for demo mode
```

### File Locations

```
Key Implementation Files:

Unified System:
  apps/golf/src/lib/unified-competition.ts

API Routes:
  apps/golf/src/app/api/
  ├── tournaments/[id]/competitions/
  ├── competitions/[competitionId]/entries/
  ├── one-2-one/
  │   ├── join/route.ts
  │   ├── my-matches/route.ts
  │   └── cron/cancel-unfilled/route.ts
  └── wallet/

Frontend Pages:
  apps/golf/src/app/
  ├── tournaments/[slug]/page.tsx
  ├── one-2-one/[slug]/page.tsx
  ├── clubhouse/events/[id]/page.tsx
  └── build-team/[competitionId]/page.tsx

Scoring:
  packages/scoring-service/src/index.ts
```

---

## Architecture Diagrams

### System Component Diagram

```
                    ┌─────────────────────────────────┐
                    │         User Browser            │
                    └──────────────┬──────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐          ┌───────────────┐        ┌───────────────┐
│   Golf App    │          │   Admin App   │        │    Web App    │
│  (Port 3003)  │          │  (Port 3002)  │        │  (Port 3000)  │
│               │          │               │        │               │
│ • InPlay      │          │ • Tournament  │        │ • Landing     │
│ • ONE 2 ONE   │          │   Management  │        │ • Auth        │
│ • Clubhouse   │          │ • Golfer Sync │        │ • Waitlist    │
│ • Wallet      │          │ • Email       │        │               │
└───────┬───────┘          └───────┬───────┘        └───────┬───────┘
        │                          │                        │
        └──────────────────────────┼────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │    Next.js API Routes        │
                    │  /api/tournaments/           │
                    │  /api/competitions/          │
                    │  /api/one-2-one/             │
                    │  /api/wallet/                │
                    └──────────┬───────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
    │   Supabase   │   │   DataGolf   │  │    Stripe    │
    │  PostgreSQL  │   │     API      │  │   Payments   │
    │              │   │              │  │              │
    │ • Unified    │   │ • Scores     │  │ • Checkout   │
    │   Comps      │   │ • Salaries   │  │ • Webhooks   │
    │ • Entries    │   │ • Rankings   │  │ • Wallet     │
    │ • Wallet     │   │              │  │   Top-ups    │
    └──────────────┘   └──────────────┘  └──────────────┘
```

### Data Flow: Entry Creation

```
    USER
      │
      │ 1. Select Competition
      ▼
┌─────────────────┐
│  Browse Comps   │
│  (/tournaments/ │
│   or /one-2-one)│
└────────┬────────┘
         │
         │ 2. Build Team
         ▼
┌─────────────────┐
│ Team Builder    │
│ Select 6        │
│ Choose Captain  │
└────────┬────────┘
         │
         │ 3. Submit Entry
         ▼
┌──────────────────────────────────────┐
│ POST /api/competitions/[id]/entries  │
├──────────────────────────────────────┤
│ A. Validate golfers                  │
│ B. Check wallet balance              │
│ C. wallet_apply(-entry_fee)          │
│ D. Create competition_entries        │
│ E. Create entry_picks                │
│ F. Increment current_players         │
└────────┬─────────────────────────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│  Confirmation   │
│  Page + Wallet  │
│  Balance Update │
└─────────────────┘
```

---

## Quick Reference

### Status Values by System

#### InPlay Competitions (`tournament_competitions` where `competition_format='inplay'`)
```sql
-- Database Constraint:
CHECK (status IN ('draft', 'upcoming', 'reg_open', 'live', 'completed', 'cancelled'))

-- TypeScript Type:
type CompetitionStatus = 'upcoming' | 'reg_open' | 'live' | 'completed' | 'cancelled';
```

**Lifecycle:**
- `upcoming` → Registration not yet open
- `reg_open` → Can accept entries
- `live` → Tournament in progress
- `completed` → Final results available
- `cancelled` → Tournament cancelled

#### ONE 2 ONE Challenges (`tournament_competitions` where `competition_format='one2one'`)
```sql
-- Database: Same as InPlay (uses tournament_competitions.status)
-- But frontend type is different:
type ChallengeStatus = 'pending' | 'open' | 'in-play' | 'completed' | 'cancelled';
```

**Lifecycle:**
- `pending` → User created but not activated
- `open` → Waiting for opponent (1/2 players)
- `in-play` → Challenge active (2/2 players)
- `completed` → Winner determined
- `cancelled` → Unfilled or manually cancelled

⚠️ **Note:** Mismatch between database values and frontend types exists. Frontend normalizes in `status-utils.ts`.

#### Tournaments (`tournaments` table)
```typescript
type TournamentStatus = 'upcoming' | 'registration_open' | 'live' | 'completed' | 'cancelled';
```

**Note:** Different from competition status! Tournament uses `registration_open`, competition uses `reg_open`.

#### Clubhouse Events (`clubhouse_events` table)
```sql
-- Database Constraint (CLEAN):
CHECK (status IN ('upcoming', 'open', 'active', 'completed'))

-- TypeScript Type:
type EventStatus = 'upcoming' | 'open' | 'active' | 'completed';
```

**Lifecycle (Auto-Calculated by Trigger):**
- `upcoming` → Before registration opens
- `open` → Registration open, event not started
- `active` → Event in progress
- `completed` → Event finished

✅ **This is the CORRECT pattern** - to be backported to InPlay after testing.

### Common Queries

#### Get All InPlay Competitions for Tournament
```typescript
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('tournament_id', tournamentId)
  .eq('competition_format', 'inplay')
  .not('competition_type_id', 'is', null);
```

#### Get All ONE 2 ONE Challenges for Tournament
```typescript
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('tournament_id', tournamentId)
  .eq('competition_format', 'one2one')
  .not('template_id', 'is', null);
```

#### Get User's Entry for Competition (Works for Both Types)
```typescript
const { data } = await supabase
  .from('competition_entries')
  .select('*')
  .eq('competition_id', competitionId)
  .eq('user_id', userId)
  .single();
```

#### Check if Competition is Open for Registration
```typescript
const { data: competition } = await supabase
  .from('tournament_competitions')
  .select('status, reg_close_at')
  .eq('id', competitionId)
  .single();

const isOpen = competition.status === 'reg_open' && 
               new Date(competition.reg_close_at) > new Date();
```

#### Deduct from Wallet (Atomic)
```typescript
const { data, error } = await supabase.rpc('deduct_from_wallet', {
  p_user_id: userId,
  p_amount_cents: entryFeePennies,
  p_reason: `Entry: ${competitionName}`
});

if (error?.message?.includes('Insufficient funds')) {
  // Handle insufficient balance
}
```

#### Get Available Golfers for Competition
```typescript
// Step 1: Get competition's assigned golfer group
const { data: competition } = await supabase
  .from('tournament_competitions')
  .select('assigned_golfer_group_id')
  .eq('id', competitionId)
  .single();

// Step 2: Get golfers in that group
const { data: members } = await supabase
  .from('golfer_group_members')
  .select(`
    golfers (
      id, first_name, last_name, country,
      tournament_golfers!inner (
        salary, status
      )
    )
  `)
  .eq('group_id', competition.assigned_golfer_group_id);

// Step 3: Filter confirmed golfers only
const availableGolfers = members
  .map(m => m.golfers)
  .filter(g => g.tournament_golfers[0]?.status === 'confirmed');
```

### Environment Variables

**Required in ALL apps** (golf, admin, web):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Public key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # Admin key (SERVER ONLY!)

# DataGolf
DATAGOLF_API_KEY=dg-your-key-here

# Stripe (Production)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe (Testing)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3003  # or https://yourdomain.com

# Optional: Force demo mode (bypasses Stripe)
NEXT_PUBLIC_STRIPE_ENABLED=false
```

### Critical File Locations

**Database Schema:**
- `DATABASE-SCHEMA-REFERENCE.md` - Complete schema documentation
- `scripts/clubhouse/01-create-schema.sql` - Clubhouse schema
- `scripts/2025-01-*.sql` - Migration scripts

**Planning Documents:**
- `SYSTEMATIC-FIX-PLAN.md` - Strategy for fixing issues
- `CLUBHOUSE-SYSTEM-PLAN.md` - Clubhouse implementation plan
- `PRE-CHANGE-CHECKLIST.md` - MUST READ before code changes
- `scripts/clubhouse/ARCHITECTURE-DIAGRAM.txt` - Visual diagrams

**API Patterns:**
- `apps/golf/src/lib/supabaseClient.ts` - Browser client
- `apps/golf/src/lib/supabaseServer.ts` - Server client
- `apps/admin/src/lib/supabaseAdminServer.ts` - Admin client

**Utility Functions:**
- `apps/golf/src/lib/unified-competition.ts` - Type detection
- `apps/golf/src/lib/status-utils.ts` - Status normalization
- `apps/golf/src/lib/timing-utils.ts` - Date/time helpers
- `apps/golf/src/lib/types.ts` - TypeScript interfaces

**Scoring:**
- `packages/scoring-service/src/index.ts` - DataGolf adapter
- `apps/golf/src/app/api/fantasy/calculate-scores/route.ts` - Live scoring

**Wallet:**
- `apps/golf/src/app/api/stripe/` - Payment integration
- `apps/golf/src/app/wallet/page.tsx` - User wallet UI

### Diagnostic Scripts

**Database Validation:**
```powershell
node check-database.js                    # Verify DB schema
node check-tournament-setup.js            # Validate tournament
node check-entries.js                     # Check entry data
node comprehensive-timing-check.js        # Timing validation
```

**DataGolf Testing:**
```powershell
node test-datagolf-connection.js          # API connectivity
.\get-datagolf-events.ps1                 # Fetch tournaments
node sync-dunhill-scores.js               # Manual score sync
```

**Quick Health Checks:**
```powershell
node quick-db-check.js                    # Fast DB health
node check-tournament-status.js           # Status consistency
node diagnose-golfer-visibility.js        # Golfer group issues
```

**Emergency Cleanup:**
```powershell
node delete-competition-entries.js        # Remove test entries
# SQL scripts in /scripts/ folder - run in Supabase SQL Editor
# ⚠️ CAUTION: Some scripts have "nuclear" in name - use carefully!
```

### Common Errors & Solutions

**Error:** `relation "competition_instances" does not exist`  
**Cause:** Code referencing old deleted table  
**Fix:** Use `tournament_competitions` instead

**Error:** `column "instance_id" does not exist`  
**Cause:** Code trying to use removed column  
**Fix:** Use `competition_id` for both InPlay and ONE 2 ONE

**Error:** `Insufficient funds` when creating entry  
**Cause:** Wallet balance < entry fee  
**Fix:** Check balance BEFORE attempting `deduct_from_wallet()`

**Error:** Competition not visible on frontend  
**Cause:** Status filter mismatch or golfer group not assigned  
**Fix:** Check `competition.status` and `assigned_golfer_group_id`

**Error:** Timing dates don't update  
**Cause:** HTTP fetch() to sync endpoint failed  
**Fix:** In Clubhouse, trigger does this automatically. In InPlay, run manual sync script.

**Error:** Port 3003 already in use  
**Cause:** Previous dev server didn't shut down  
**Fix:** `pnpm kill:ports` then restart

**Error:** `display_name` shows "User [id]"  
**Cause:** Profile missing first_name/last_name  
**Fix:** Update profile with names, display_name auto-recalculates

---

## Troubleshooting

### "instance_id doesn't exist" Error

**Problem:** Code trying to reference deleted `instance_id` column

**Solution:** Use `competition_id` instead - works for both InPlay and ONE 2 ONE

```typescript
// ❌ Wrong
.eq('instance_id', id)

// ✅ Correct
.eq('competition_id', id)
```

### "Competition not found" for ONE 2 ONE

**Problem:** Query missing `competition_format` filter

**Solution:** Add format check

```typescript
// ❌ Wrong
.from('tournament_competitions')
.eq('id', id)

// ✅ Correct
.from('tournament_competitions')
.eq('id', id)
.eq('competition_format', 'one2one')
```

### Wallet Balance Not Updating

**Problem:** Direct wallet table update instead of RPC

**Solution:** Always use `wallet_apply()` function

### Port Already in Use

**Problem:** Previous dev server didn't shut down cleanly

**Solution:** `pnpm kill:ports` then `pnpm dev:golf`

---

## Next Steps & Future Enhancements

1. **Live Notifications** - Push updates for scoring changes
2. **Prize Distribution** - Automated payouts to winners
3. **Social Features** - Friends, leagues, chat
4. **Mobile App** - React Native wrapper
5. **Additional Sports** - NFL, NBA integration via SportsRadar

---

**Document Version:** 2.0  
**Last Updated:** January 5, 2026  
**Maintainer:** Development Team  
**Questions?** Check `PRE-CHANGE-CHECKLIST.md` before making changes!

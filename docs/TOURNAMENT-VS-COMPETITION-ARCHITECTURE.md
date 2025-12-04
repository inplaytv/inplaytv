# Tournament vs Competition Architecture

## CRITICAL ARCHITECTURAL RULE

**Tournament Status and Competition Registration are COMPLETELY INDEPENDENT concepts.**

This separation is fundamental to the entire system and must be maintained throughout the codebase.

---

## The Two Separate Concepts

### 1. Tournament Status (Golf Event Timing)

**What it represents:** When the actual golf tournament happens in the real world.

**Database Fields:**
- `tournaments.start_date` - When Round 1 tees off
- `tournaments.end_date` - When the final round completes

**Status Values:**
- Upcoming: Tournament hasn't started yet
- In Progress: Tournament is currently being played
- Completed: Tournament has finished

**Purpose:** Display tournament information, show live leaderboards, manage scoring

---

### 2. Competition Registration (User Entry Windows)

**What it represents:** When users can register/enter fantasy competitions.

**Database Fields:**
- `tournament_competitions.reg_open_at` - When registration opens for users
- `tournament_competitions.reg_close_at` - When registration closes for users

**Status Values:**
- Registration Open: Users can build teams and enter
- Registration Closed: Deadline has passed, no more entries
- Live: Registration closed but tournament still in progress
- Completed: Tournament finished, competition finalized

**Purpose:** Control when users can submit fantasy team entries

---

## Why They're Separate

### Problem with Conflating Them

❌ **WRONG:** "Tournament has started → Block all competition registration"

This breaks the business model because:
1. Different competitions have different entry windows
2. Some competitions explicitly allow entries during tournament play
3. Registration deadlines are competition-specific, not tournament-wide

### Correct Architecture

✅ **RIGHT:** Each competition has its own `reg_close_at` timestamp that determines when registration closes, completely independent of tournament timing.

---

## Competition Types & Registration Windows

### Full Course (4 Rounds)
- **Rounds:** R1, R2, R3, R4
- **Registration Closes:** Before R1 starts
- **Reason:** Team plays all 4 rounds, can't change after tournament starts

### First Strike (R1 Only)
- **Rounds:** R1
- **Registration Closes:** Before R1 starts
- **Reason:** Only R1 counts, must lock before first shots

### Beat The Cut (R1-R2)
- **Rounds:** R1, R2
- **Registration Closes:** Before R1 starts
- **Reason:** Making the cut requires R1-R2 performance

### THE WEEKENDER (R3-R4)
- **Rounds:** R3, R4
- **Registration Closes:** Before R3 starts
- **Reason:** Only weekend rounds count, can register after R1-R2 complete
- **KEY:** Tournament is "In Progress" but registration is still open!

### Final Strike (R4 Only)
- **Rounds:** R4
- **Registration Closes:** Before R4 starts
- **Reason:** Only final round counts, can register after R1-R3
- **KEY:** Tournament is "In Progress" but registration is still open!

### ONE 2 ONE (Daily, All Rounds)
- **Rounds:** R1, R2, R3, R4 (daily head-to-head)
- **Registration Closes:** Throughout tournament (daily deadlines or end of tournament)
- **Reason:** Each round is independent, users can enter for remaining rounds
- **KEY:** Tournament is "In Progress" AND registration stays open!

---

## Implementation Rules

### ❌ NEVER DO THIS

```typescript
// WRONG: Checking tournament status to gate competition registration
if (tournament.start_date && now >= tournament.start_date) {
  return 'Registration Closed';
}

// WRONG: Using tournament dates in registration validation
if (tournamentHasStarted) {
  alert('Tournament has started, registration closed');
  return;
}
```

### ✅ ALWAYS DO THIS

```typescript
// RIGHT: Only check competition's own registration deadline
if (competition.reg_close_at && now >= competition.reg_close_at) {
  return 'Registration Closed';
}

// RIGHT: Validate only against competition deadline
const regClose = new Date(competition.reg_close_at);
if (now >= regClose) {
  alert('Registration deadline for this competition has passed');
  return;
}
```

---

## Code Locations

### Files That Must Maintain Separation

1. **Tournament Detail Page**
   - `apps/golf/src/app/tournaments/[slug]/page.tsx`
   - `getStatusBadge()` function
   - ✅ Checks `competition.reg_close_at` ONLY

2. **Tournaments List Page**
   - `apps/golf/src/app/tournaments/page.tsx`
   - `handleBuildTeam()` function
   - ✅ Validates `competition.reg_close_at` ONLY

3. **Build Team Page**
   - `apps/golf/src/app/build-team/[competitionId]/page.tsx`
   - Registration validation logic
   - ✅ Checks `competition.reg_close_at` ONLY

4. **Entry Submission API**
   - `apps/golf/src/app/api/competitions/[competitionId]/entries/route.ts`
   - Server-side validation
   - ✅ Must validate `competition.reg_close_at` ONLY

---

## Visual Representation

### Timeline Example: Nedbank Golf Challenge (Dec 4-7, 2025)

```
              Tournament Timeline
┌─────────────────────────────────────────────────┐
│  Dec 4    │  Dec 5    │  Dec 6    │  Dec 7     │
│   R1      │   R2      │   R3      │   R4       │
└─────────────────────────────────────────────────┘
  ▲                       ▲           ▲            ▲
  │                       │           │            │
  │                       │           │            │
  Full Course             │           │            │
  First Strike            │           │            │
  Beat The Cut            │           │            │
  (Close before R1)       │           │            │
                          │           │            │
                    THE WEEKENDER     │            │
                    (Closes before R3)│            │
                                      │            │
                                Final Strike       │
                                (Closes before R4) │
                                                   │
                                         ONE 2 ONE │
                                    (Stays open until end)
```

### User Experience

**Dec 4, 8:00 AM (R1 in progress):**
- Tournament Status: 🔴 "Tournament In Play"
- Full Course: ❌ Registration Closed
- First Strike: ❌ Registration Closed
- Beat The Cut: ❌ Registration Closed
- THE WEEKENDER: ✅ Registration Open (closes before R3)
- Final Strike: ✅ Registration Open (closes before R4)
- ONE 2 ONE: ✅ Registration Open (stays open)

**Dec 6, 8:00 AM (R3 in progress):**
- Tournament Status: 🔴 "Tournament In Play"
- Full Course: ❌ Registration Closed
- First Strike: ❌ Registration Closed
- Beat The Cut: ❌ Registration Closed
- THE WEEKENDER: ❌ Registration Closed (R3 started)
- Final Strike: ✅ Registration Open (closes before R4)
- ONE 2 ONE: ✅ Registration Open (stays open)

---

## Database Schema

### Correct Structure

```sql
-- Tournaments: Represent real golf events
CREATE TABLE tournaments (
  id UUID PRIMARY KEY,
  name TEXT,
  start_date TIMESTAMPTZ,  -- When golf starts
  end_date TIMESTAMPTZ,    -- When golf ends
  status TEXT              -- Tournament status (not registration)
);

-- Competitions: Fantasy competitions within tournaments
CREATE TABLE tournament_competitions (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  competition_type_id UUID,
  reg_open_at TIMESTAMPTZ,   -- When users can start entering
  reg_close_at TIMESTAMPTZ,  -- When registration closes
  status TEXT                 -- Competition status
);
```

### Setting Registration Close Times

```sql
-- Example: Nedbank Golf Challenge (Dec 4-7)

-- Full Course: Close before R1
UPDATE tournament_competitions 
SET reg_close_at = '2025-12-04T00:00:00+00:00'
WHERE competition_type = 'Full Course';

-- THE WEEKENDER: Close before R3
UPDATE tournament_competitions 
SET reg_close_at = '2025-12-06T00:00:00+00:00'
WHERE competition_type = 'THE WEEKENDER';

-- Final Strike: Close before R4
UPDATE tournament_competitions 
SET reg_close_at = '2025-12-07T00:00:00+00:00'
WHERE competition_type = 'Final Strike';

-- ONE 2 ONE: Stay open until tournament ends
UPDATE tournament_competitions 
SET reg_close_at = '2025-12-07T23:59:00+00:00'
WHERE competition_type = 'ONE 2 ONE';
```

---

## Testing Checklist

When making changes, verify:

- [ ] Competition registration can be open while tournament is "In Play"
- [ ] Each competition type respects its own `reg_close_at` deadline
- [ ] Tournament start date NEVER blocks competition registration
- [ ] "Build Team" button works if `reg_close_at` hasn't passed
- [ ] Status badges show correct registration status per competition
- [ ] Countdown timers show time until `reg_close_at`, not tournament start
- [ ] Server-side validation only checks `competition.reg_close_at`

---

## Historical Issues

### Issue #1: All competitions showing as closed
**Date:** December 4, 2025
**Cause:** All competitions had `reg_close_at = tournament.start_date`
**Fix:** Updated each competition type with proper deadline
**Lesson:** Registration deadlines must be set per competition type

### Issue #2: Tournament In Play blocked registration
**Date:** December 4, 2025
**Cause:** Code checked `tournament.start_date` before `competition.reg_close_at`
**Fix:** Removed tournament date checks from registration logic
**Lesson:** Never gate competition registration on tournament status

---

## Summary

**The Golden Rule:**

> Competition registration is controlled by `competition.reg_close_at` and NOTHING ELSE.
> Tournament timing (start_date, end_date) is for display and scoring, NOT registration.

**When in doubt:**
- Is it about golf rounds being played? → Use tournament dates
- Is it about users entering competitions? → Use competition registration dates
- NEVER mix the two!

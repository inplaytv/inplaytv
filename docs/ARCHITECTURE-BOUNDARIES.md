# Architecture Boundaries & Naming Standards

## Critical Issues Found

### 1. Status Naming Chaos

**Database uses:**
- `reg_open`, `live`, `completed`, `upcoming`

**Frontend uses:**
- `registration_open`, `in-play`, `in_progress`, `active`

**Mixed usage in leaderboards/page.tsx:**
```typescript
status === 'live' || status === 'in-play'  // ❌ Checking both
status === 'registration_open' || status === 'reg_open'  // ❌ Checking both
```

**SOLUTION NEEDED:** Pick ONE standard for each status

---

## Feature Boundaries

### A. InPlay Competitions (Tournament-based)
**Database:** `tournament_competitions` table
**Types:** Full Course, Beat The Cut, Final Strike, The Weekender, etc.
**Identifier:** Has `competition_type_id` (FK to `competition_types`)
**Pages:**
- `/tournaments` - List view
- `/tournaments/[slug]` - Individual competition
- LEFT side of `/leaderboards` - InPlay fantasy scoring

**Key Fields:**
- `status`: Uses `reg_open`, `live`, `completed`
- `reg_close_at`: Registration deadline
- `start_time`: When competition scoring begins
- `end_time`: When competition scoring ends

**Rules:**
- Linked to real PGA tournaments
- Multiple competitions per tournament
- Users select golfers
- Fantasy scoring based on real scores

---

### B. ONE 2 ONE Challenges (Instance-based)
**Database:** `one_2_one_templates` + `one_2_one_instances`
**Identifier:** Has `rounds_covered`, NO `competition_type_id`
**Pages:**
- `/one-2-one` - Available challenges
- `/one-2-one/[slug]` - Challenge lobby
- `/one-2-one/challenge/[instanceId]` - Active match

**Key Fields:**
- `status`: Uses `open`, `in-play`, `completed`
- `rounds_covered`: e.g., "1,2" or "1,2,3,4"
- Instance has separate status from template

**Rules:**
- **COMPLETELY SEPARATE** from InPlay competitions
- Head-to-head matches
- Players challenge each other
- Instance-based (each match is unique)
- Never appears in tournament competitions list

**Current Issue:** Templates query sometimes returns both types

---

### C. Tournament Leaderboard (Real Golf)
**Location:** RIGHT side of `/leaderboards`
**Data Source:** `golfer_scores`, `golfer_rounds`
**Shows:**
- Real PGA golfer scores
- Round-by-round scores
- Tee times
- Tournament positions

**Rules:**
- Read-only (no user interaction)
- Updates from PGA data
- Shows actual golf tournament
- Independent of fantasy competition

---

### D. InPlay Leaderboard (Fantasy Scoring)
**Location:** LEFT side of `/leaderboards`
**Data Source:** `entry_golfers`, `entries`, calculated scores
**Shows:**
- User fantasy scores
- User selections
- Competition positions
- Real-time fantasy points

**Rules:**
- User-interactive (can view selections)
- Calculated from user picks + real scores
- Shows competition standings
- Updates as tournament progresses

**Current Issue:** Sometimes called "live leaderboard" vs "inplay leaderboard"

---

### E. My Scorecard (User Entries)
**Location:** `/entries` page
**Data Source:** `entries`, `entry_golfers`
**Shows:**
- All user purchases
- Past and current selections
- Entry status
- Competition history

**Status:** ✅ Working well, stable

---

## Naming Conflicts to Fix

### Status Values

| Database Value | Should Be Used In Frontend As | Notes |
|---|---|---|
| `reg_open` | `reg_open` | ❌ Currently mixed with `registration_open` |
| `live` | `live` | ❌ Currently mixed with `in-play`, `in_progress`, `active` |
| `completed` | `completed` | ✅ Consistent |
| `upcoming` | `upcoming` | ✅ Consistent |

**DECISION NEEDED:** Standardize on database values throughout frontend?

---

### Type Identifiers

**InPlay Competitions:**
```typescript
// ✅ CORRECT identification
competition_type_id IS NOT NULL
rounds_covered IS NULL
```

**ONE 2 ONE:**
```typescript
// ✅ CORRECT identification
competition_type_id IS NULL
rounds_covered IS NOT NULL
```

**Current Issue:** Some queries don't filter properly

---

## Critical Timing Fields

### Tournament Level
```sql
tournaments
  - start_date: When tournament starts
  - end_date: When tournament ends
  - status: Tournament status
```

### Competition Level (InPlay)
```sql
tournament_competitions
  - reg_close_at: When registration closes
  - start_time: When competition scoring starts
  - end_time: When competition scoring ends
  - status: Competition status (can differ from tournament)
```

### ONE 2 ONE Level
```sql
one_2_one_templates
  - tournament_id: Linked tournament
  - rounds_covered: Which rounds this covers
  - entry_fee: Cost to play

one_2_one_instances
  - template_id: Which template
  - challenger_id: Who created it
  - opponent_id: Who accepted
  - status: Instance status
  - created_at: When challenge was made
```

**Current Issues:**
1. Frontend sometimes checks tournament status instead of competition status
2. Confusion between `start_time` (competition) and `start_date` (tournament)
3. Registration timing not consistently enforced

---

## Recommended Actions

### 1. Status Standardization
**Priority: HIGH**

Create utility functions:
```typescript
// apps/golf/src/lib/status-utils.ts
export function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    'registration_open': 'reg_open',
    'in-play': 'live',
    'in_progress': 'live',
    'active': 'live',
  };
  return map[status] || status;
}

export function isRegistrationOpen(comp: Competition): boolean {
  return comp.status === 'reg_open' && 
         (!comp.reg_close_at || new Date() < new Date(comp.reg_close_at));
}

export function isLive(comp: Competition): boolean {
  return comp.status === 'live';
}
```

### 2. Type Guards
**Priority: HIGH**

```typescript
// apps/golf/src/lib/competition-utils.ts
export function isInPlayCompetition(comp: any): boolean {
  return comp.competition_type_id !== null && comp.competition_type_id !== undefined;
}

export function isOne2OneTemplate(comp: any): boolean {
  return comp.rounds_covered !== null && comp.rounds_covered !== undefined;
}
```

### 3. Timing Validation
**Priority: MEDIUM**

```typescript
export function canRegister(comp: Competition): boolean {
  if (comp.status !== 'reg_open') return false;
  if (!comp.reg_close_at) return true;
  return new Date() < new Date(comp.reg_close_at);
}

export function hasStarted(comp: Competition): boolean {
  if (!comp.start_time) return comp.status === 'live';
  return new Date() >= new Date(comp.start_time);
}
```

### 4. Database Query Standards
**Priority: HIGH**

**InPlay Competitions Only:**
```sql
SELECT * FROM tournament_competitions
WHERE competition_type_id IS NOT NULL
  AND rounds_covered IS NULL
```

**ONE 2 ONE Templates Only:**
```sql
SELECT * FROM one_2_one_templates
WHERE competition_type_id IS NULL
  AND rounds_covered IS NOT NULL
```

### 5. Component Separation
**Priority: MEDIUM**

Create separate components:
- `<InPlayLeaderboard>` - Left side, fantasy scores
- `<TournamentLeaderboard>` - Right side, real golf
- `<InPlayCompetitionCard>` - Tournament competitions
- `<One2OneCard>` - Challenge matches

---

## Migration Plan

1. **Phase 1:** Create utility functions (1 hour)
2. **Phase 2:** Update leaderboards page to use utilities (2 hours)
3. **Phase 3:** Update tournaments page to use type guards (1 hour)
4. **Phase 4:** Update one-2-one to enforce separation (1 hour)
5. **Phase 5:** Add timing validation everywhere (2 hours)
6. **Phase 6:** Test and verify boundaries (2 hours)

**Total Estimate:** ~9 hours

---

## Questions to Answer

1. **Status naming:** Use database values everywhere? Or map to frontend-friendly names?
2. **"Live" vs "InPlay":** Which term for active competitions?
3. **Tournament status vs Competition status:** When to check which?
4. **Registration timing:** Should frontend enforce or trust backend?
5. **ONE 2 ONE visibility:** Should templates ever appear in tournament lists?


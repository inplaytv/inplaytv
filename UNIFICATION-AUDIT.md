# InPlay Competitions vs ONE 2 ONE Challenges - Unification Audit

## Executive Summary
Both systems use the same team structure (6 golfers + 1 captain), same scoring logic, and same entry/pick tables. The ONLY real differences are:
1. ONE 2 ONE uses `competition_instances` table, InPlay uses `tournament_competitions`
2. ONE 2 ONE allows user-set stakes, InPlay has admin-set entry fees
3. ONE 2 ONE is head-to-head (2 players max), InPlay is multi-player

**Goal:** Gradually unify the code so both systems share the same logic, reducing duplicate code and preventing bugs.

---

## Divergence Points (Grouped by Area)

### 1. DATABASE LAYER

#### Tables
- **InPlay:** `tournament_competitions` with `competition_type_id` (NOT NULL), `rounds_covered` (NULL)
- **ONE 2 ONE:** `competition_instances` with `competition_type_id` (NULL), `rounds_covered` (NOT NULL)
- **Shared:** Both link to `competition_entries` via `competition_id` or `instance_id` (mutually exclusive)

**Status:** ✅ Database constraint enforces mutual exclusivity - no change needed

#### Type Detection Logic
**File:** `apps/golf/src/lib/competition-utils.ts`
```typescript
// Lines 38-51: Type guards
export function isInPlayCompetition(item: any): item is InPlayCompetition
export function isOne2OneCompetition(item: any): item is One2OneCompetition
export function isInPlayEntry(item: any): boolean
export function isOne2OneEntry(item: any): boolean
```

**Status:** ✅ Well-structured - keep these guards but use consistently everywhere

---

### 2. API ROUTES (Entry Management)

#### Shared Entry APIs (Already Unified!)
These APIs already handle BOTH competition types:

**File:** `apps/golf/src/app/api/competitions/[competitionId]/my-entry/route.ts`
- Line 26: `.or('competition_id.eq.${competitionId},instance_id.eq.${competitionId}')`
- ✅ GET and POST both check both ID types

**File:** `apps/golf/src/app/api/competitions/[competitionId]/entrants/route.ts`
- Line 69: `.or('competition_id.eq.${competitionId},instance_id.eq.${competitionId}')`
- ✅ Already unified

**File:** `apps/golf/src/app/api/entries/[entryId]/picks-with-golfers/route.ts`
- Line 22: Selects both `competition_id` and `instance_id`
- Line 81: `const compId = entry.competition_id || entry.instance_id`
- ✅ Already unified

**File:** `apps/golf/src/app/api/user/my-entries/route.ts`
- Lines 58-232: Handles both competition types in single query
- ✅ Already unified

**Action:** ✅ No changes needed - these are already unified!

---

#### Separate ONE 2 ONE APIs (Should These Be Merged?)

**Challenge-Specific Operations:**
1. `apps/golf/src/app/api/one-2-one/templates/[tournamentId]/route.ts` - Fetch templates
2. `apps/golf/src/app/api/one-2-one/open-challenges/[tournamentId]/route.ts` - Open challenges
3. `apps/golf/src/app/api/one-2-one/instances/[instanceId]/activate/route.ts` - Activate instance
4. `apps/golf/src/app/api/one-2-one/instances/[instanceId]/join/route.ts` - Join challenge
5. `apps/golf/src/app/api/one-2-one/cron/cancel-unfilled/route.ts` - Auto-cancel + refund

**Question:** Should these be moved to generic `/api/competitions/` routes?
- `GET /api/competitions/templates/[tournamentId]` instead of `/api/one-2-one/templates/`?
- `POST /api/competitions/[id]/join` for both InPlay and ONE 2 ONE?

**Recommendation:** Keep separate for now, but unify the LOGIC inside them

---

### 3. FRONTEND PAGES

#### Completely Separate Pages
**ONE 2 ONE Pages:**
- `apps/golf/src/app/one-2-one/page.tsx` - Challenge browser
- `apps/golf/src/app/one-2-one/[slug]/page.tsx` - Create challenge for tournament
- `apps/golf/src/app/one-2-one/challenge/[instanceId]/page.tsx` - Challenge detail

**InPlay Pages:**
- `apps/golf/src/app/tournaments/[slug]/page.tsx` - Tournament with InPlay competitions

**Key Differences:**
| Feature | InPlay | ONE 2 ONE |
|---------|--------|-----------|
| **Competition List** | Shows 6 pre-made competitions | Shows templates grouped by rounds |
| **Entry Creation** | Click "Enter Now" → Team Builder | Select template → Set stake → Activate → Team Builder |
| **Stakes** | Admin-set (£10, £25, etc.) | User-set (£5-£500) |
| **Opponent Selection** | Auto-matched (no limit) | Challenge board (exactly 2 players) |

**Recommendation:** Keep separate pages BUT share the team builder component

---

### 4. TEAM BUILDER (Biggest Opportunity!)

#### Current State: DUPLICATE CODE
**InPlay Team Builder:** `apps/golf/src/app/build-team/[competitionId]/page.tsx`
**ONE 2 ONE Team Builder:** `apps/golf/src/app/one-2-one/challenge/[instanceId]/page.tsx` (uses ChallengeView.tsx)

**Similarities:**
- Both fetch 6 golfers + 1 captain
- Both use `competition_entries` and `entry_picks` tables
- Both validate salary cap
- Both handle draft/submitted status

**Differences:**
- InPlay: Uses `competition_id`
- ONE 2 ONE: Uses `instance_id`
- Different navigation after submission

**Action Required:** 🔥 **HIGH PRIORITY - CREATE UNIFIED TEAM BUILDER**

Create: `apps/golf/src/components/TeamBuilder/UnifiedTeamBuilder.tsx`
```typescript
interface UnifiedTeamBuilderProps {
  competitionId?: string;  // For InPlay
  instanceId?: string;     // For ONE 2 ONE
  tournamentSlug: string;
  onSuccess: (entryId: string) => void;
}
```

---

### 5. LEADERBOARDS & SCORING

#### Current Status
**File:** `apps/golf/src/app/leaderboards/[competitionId]/page.tsx`

Check if this already handles both types...

**Action Required:** Audit leaderboard code to see if it's unified or duplicate

---

### 6. ENTRY VALIDATION

#### Wallet Deduction Logic
**InPlay:** Done in `/api/competitions/[id]/entries` POST
**ONE 2 ONE:** Done in `/api/one-2-one/instances/[instanceId]/activate`

**Question:** Should activation also use the unified entry creation API?

---

## UNIFICATION ROADMAP (Priority Order)

### Phase 1: Create Shared Utilities (Least Disruptive) ⭐ START HERE
**Create:** `apps/golf/src/lib/unified-competition.ts`
```typescript
// Shared functions that work with both types
export function getCompetitionId(item: any): string {
  return item.competition_id || item.instance_id;
}

export function getCompetitionType(item: any): 'inplay' | 'one2one' {
  return item.competition_id ? 'inplay' : 'one2one';
}

export async function fetchCompetitionDetails(id: string, supabase: SupabaseClient) {
  // Try InPlay first
  const { data: inplay } = await supabase
    .from('tournament_competitions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (inplay) return { type: 'inplay', data: inplay };
  
  // Try ONE 2 ONE
  const { data: one2one } = await supabase
    .from('competition_instances')
    .select('*')
    .eq('id', id)
    .single();
  
  return { type: 'one2one', data: one2one };
}

export async function fetchAvailableGolfers(competitionIdOrInstanceId: string, supabase: SupabaseClient) {
  // Unified logic to get golfer list for BOTH types
  // Uses competition_golfers or golfer_group_members based on type
}
```

**Files to Update:**
- ✅ `apps/golf/src/lib/competition-utils.ts` - Add these functions
- Update all API routes to import and use them

---

### Phase 2: Unify Team Builder Component 🔥
**Action:** Create single team builder that accepts either `competitionId` or `instanceId`
- Extract common logic from both builders
- Use shared utility functions
- Keep entry submission logic that checks which ID type is present
- **CRITICAL:** Support both CREATE and EDIT modes (user wants to edit scorecard before tee-off)

**Team Builder Modes:**
1. **CREATE Mode:** New entry, empty team
2. **EDIT Mode:** Load existing entry, pre-populate team, allow changes until tee-off

**Edit Validation Rules:**
- Can only edit if `entry.status = 'draft'` OR `entry.status = 'submitted'` AND `competition.start_at > NOW()`
- After tee-off: Show "Locked - Competition Started" message
- After edit: Recalculate total salary, validate captain still in team

**Files to Create:**
- `apps/golf/src/components/TeamBuilder/UnifiedTeamBuilder.tsx` (supports mode prop)
- `apps/golf/src/components/TeamBuilder/GolferCard.tsx`
- `apps/golf/src/components/TeamBuilder/SalaryTracker.tsx`

**Files to Update:**
- `apps/golf/src/app/build-team/[competitionId]/page.tsx` - Use new component
- `apps/golf/src/app/one-2-one/challenge/[instanceId]/ChallengeView.tsx` - Use new component
- **NEW:** Add "Edit Scorecard" button to My Entries/My Scorecard pages

---

### Phase 3: Unify Entry Creation Flow
**Goal:** Single API endpoint that handles both InPlay and ONE 2 ONE entry creation + editing

**Current Separate Endpoints:**
- `POST /api/competitions/[competitionId]/my-entry` - InPlay (create)
- `POST /api/one-2-one/instances/[instanceId]/join` - ONE 2 ONE (after activation)
- **MISSING:** PUT/PATCH endpoint for editing existing entries

**Proposed Unified Endpoints:**
- `POST /api/entries/create` - Accepts either `competition_id` or `instance_id`, creates new entry
- `PUT /api/entries/[entryId]/update` - **NEW:** Updates existing entry (golfers, captain, salary)
  - Validates: Entry belongs to user
  - Validates: Competition hasn't started yet
  - Validates: Salary cap not exceeded
  - Validates: Captain is in the 6-golfer team
  - Updates: `competition_entries.total_salary`, `captain_golfer_id`, `updated_at`
  - Replaces: All `entry_picks` for this entry

**Edit Scorecard Flow:**
1. User clicks "Edit Scorecard" in My Entries
2. Redirect to team builder: `/build-team/[competitionId]?entryId=[entryId]` or `/one-2-one/challenge/[instanceId]?entryId=[entryId]`
3. Team builder detects `entryId` param → switches to EDIT mode
4. Loads existing picks, pre-populates team
5. User makes changes
6. Clicks "Save Changes" → Calls `PUT /api/entries/[entryId]/update`
7. Returns to My Entries with success message

---

### Phase 4: Unify Leaderboard Display
**Check:** Does the leaderboard already work for both types?
- If not, create unified leaderboard component
- Should handle both competition types transparently

---

### Phase 5: Unify Scoring Logic
**Status:** Already mostly unified via `packages/scoring-service/`
- Verify both types use same scoring calculation
- Document any differences

---

## MIGRATION STRATEGY

### Step-by-Step Approach:
1. ✅ **Week 1:** Create `unified-competition.ts` utility library
2. ✅ **Week 2:** Update 5 existing APIs to use new utilities (validate no regressions)
3. ✅ **Week 3:** Create unified team builder component
4. ✅ **Week 4:** Migrate InPlay pages to use unified builder
5. ✅ **Week 5:** Migrate ONE 2 ONE pages to use unified builder
6. ✅ **Week 6:** Delete old duplicate code

### Testing Checklist After Each Phase:
- [ ] Can create InPlay entry
- [ ] Can create ONE 2 ONE challenge
- [ ] Can join ONE 2 ONE challenge
- [ ] Leaderboards show correct data
- [ ] My Entries page shows both types
- [ ] Wallet deduction works correctly
- [ ] Refunds work for cancelled challenges

---

## FILES THAT NEED CHANGES (Summary)

### Create New Files:
1. `apps/golf/src/lib/unified-competition.ts` - Shared utility functions
2. `apps/golf/src/components/TeamBuilder/UnifiedTeamBuilder.tsx` - Shared team builder
3. `apps/golf/src/components/TeamBuilder/GolferCard.tsx` - Reusable golfer card
4. `apps/golf/src/components/TeamBuilder/SalaryTracker.tsx` - Reusable salary display

### Update Existing Files:
1. `apps/golf/src/app/build-team/[competitionId]/page.tsx` - Use unified builder
2. `apps/golf/src/app/one-2-one/challenge/[instanceId]/ChallengeView.tsx` - Use unified builder
3. `apps/golf/src/app/api/competitions/[competitionId]/my-entry/route.ts` - Use utilities
4. `apps/golf/src/app/api/one-2-one/instances/[instanceId]/join/route.ts` - Use utilities
5. `apps/golf/src/lib/competition-utils.ts` - Add new shared functions

### Delete After Migration:
- Old team builder logic in both InPlay and ONE 2 ONE pages (once unified builder works)

---

## ESTIMATED EFFORT
- **Phase 1 (Utilities):** 4-6 hours
- **Phase 2 (Team Builder):** 8-12 hours
- **Phase 3 (Entry API):** 4-6 hours
- **Phase 4 (Leaderboards):** 2-4 hours (if needed)
- **Total:** ~20-30 hours of focused work

---

## NEXT IMMEDIATE ACTION
Would you like me to start with **Phase 1** and create the unified utility library? This is the foundation for everything else and won't break any existing functionality.

# STATUS VALUE AUDIT - COMPREHENSIVE ANALYSIS
Date: December 31, 2025

## PROBLEM IDENTIFIED
Two different status naming conventions are being used:
- **Tournaments**: `registration_open`, `registration_closed`
- **Competitions**: `reg_open`, `reg_closed`

This inconsistency causes bugs and confusion throughout the system.

## COMPLETE REFERENCE MAP

### 1. DATABASE (Source of Truth)
**Current Constraint** (FULL-UNIFICATION-MIGRATION.sql):
```sql
CHECK (status IN (
  'draft', 'upcoming', 
  'reg_open', 'reg_closed',  -- OLD SHORT FORM
  'live', 'completed', 'cancelled', 
  'pending', 'open', 'full', 'active', 'closed'
))
```

**Actual Data in Database** (verified):
- Tournaments: `registration_open` (2 tournaments)
- Competitions: `reg_open` (7 competitions), `open` (3), `full` (1), `live` (6)

### 2. ADMIN APP FILES USING STATUS

#### A. Backend APIs (6 files)
1. **apps/admin/src/app/api/tournament-lifecycle/route.ts** - Line 82-95
   - Filters InPlay comps by `competition_format = 'inplay'`
   - Entry count query (JUST FIXED)

2. **apps/admin/src/app/api/tournament-lifecycle/auto-transition/route.ts** - Lines 88, 96, 104, 135
   - Sets: `newStatus = 'registration_open'` (TOURNAMENT status)
   - Checks: `tournament.status === 'registration_open'`

3. **apps/admin/src/app/api/tournament-lifecycle/[id]/status/route.ts** - Lines 11, 47
   - VALID_STATUSES: `['upcoming', 'registration_open', 'live', 'completed', 'cancelled']`
   - Check: `if (status === 'registration_open')`

4. **apps/admin/src/app/api/health-check/route.ts** - Line 230
   - Lists: `['upcoming', 'reg_open', 'reg_closed', 'live', 'completed']`

5. **apps/admin/src/lib/tournament-lifecycle.ts** - Lines 4, 5, 15, 16, 24, 25, 50, 54
   - Defines: `REGISTRATION_OPEN: 'reg_open'`
   - Defines: `REGISTRATION_CLOSED: 'reg_closed'`
   - **CRITICAL**: This file is the source of the `reg_open` convention for competitions!

#### B. Frontend Components (4 files)
1. **apps/admin/src/app/tournament-lifecycle/page.tsx** - 20+ references
   - Filters: `['draft', 'live', 'registration_open', 'reg_open', 'upcoming']` (BOTH!)
   - Status priority ranking includes `registration_open`
   - Display labels for tournaments

2. **apps/admin/src/app/tournaments/[id]/page.tsx** - 15+ references
   - Form default: `status: 'reg_open'` (Line 167) for competitions
   - Options: `'registration_open'` AND `'reg_open'` in different dropdowns
   - Uses tournament.`registration_opens_at` for time sync

3. **apps/admin/src/app/tournaments/new/page.tsx** - Lines 479-480
   - Tournament creation dropdown: `'registration_open'`, `'registration_closed'`

4. **apps/admin/src/app/tournaments/TournamentsList.tsx** - Lines 35-36, 40
   - Color mapping for BOTH: `registration_open` AND `reg_open`

### 3. GOLF APP FILES USING STATUS

#### A. Backend APIs (1 file)
1. **apps/golf/src/app/api/one-2-one/cron/cancel-unfilled/route.ts**
   - Sets: `status: 'cancelled'` for unfilled challenges

#### B. Frontend Components (5 files)
1. **apps/golf/src/app/tournaments/page.tsx** - 40+ references!
   - Checks: `c.status === 'reg_open'` (15+ times)
   - Checks: `tournament.status === 'registration_open'` (3 times)
   - Filters: `.in('status', ['upcoming', 'registration_open', 'registration_closed', 'live'])`
   - **CRITICAL**: Main tournament list page uses BOTH conventions!

2. **apps/golf/src/app/tournaments/[slug]/page.tsx** - 10+ references
   - Status config: `reg_open: { label: 'Registration Open' }`
   - Status config: `reg_closed: { label: 'Registration Closed' }`
   - Checks: `competition.status === 'reg_open'`
   - Uses: `template.is_open ? 'reg_open' : 'reg_closed'`

3. **apps/golf/src/app/leaderboards/page.tsx** - Lines 455, 696, 697, 748, 753
   - Checks BOTH: `tournament.status === 'registration_open' || tournament.status === 'reg_open'`
   - Returns: `{ status: 'reg_open', display: '📝 Registration Open' }`

4. **apps/golf/src/app/entries/page.tsx** - Lines 277-278, 284, 515, 555, 561, 563
   - Type definition: `'live' | 'registration_open' | 'completed'`
   - Returns: `'registration_open'` for upcoming entries

5. **apps/golf/src/app/dev-tournaments/page.tsx** - Lines 21, 132, 484, 486
   - Uses: `reg_open_at` for competition registration times

### 4. DIAGNOSTIC SCRIPTS (30+ files)
All diagnostic scripts use MIXED conventions - some check `'reg_open'`, some `'registration_open'`

## IMPACT ANALYSIS

### Files That MUST Change if Standardizing to 'registration_open':

#### CRITICAL (Break if not updated):
1. **apps/admin/src/lib/tournament-lifecycle.ts** - Constants definition
2. **apps/golf/src/app/tournaments/page.tsx** - Main tournament display logic
3. **apps/golf/src/app/tournaments/[slug]/page.tsx** - Competition detail page
4. **apps/admin/src/app/tournaments/[id]/page.tsx** - Competition form default

#### HIGH PRIORITY (Display/filter issues):
5. **apps/golf/src/app/leaderboards/page.tsx** - Status checks
6. **apps/admin/src/app/tournament-lifecycle/page.tsx** - Tournament filtering
7. **apps/admin/src/app/api/health-check/route.ts** - Valid status list
8. **apps/admin/src/app/tournaments/TournamentsList.tsx** - Color mapping

#### MEDIUM PRIORITY (Nice to have):
9. All diagnostic scripts (30+ files) - For consistency

### Database Migration Required:
```sql
-- Update existing data
UPDATE tournament_competitions SET status = 'registration_open' WHERE status = 'reg_open';
UPDATE tournament_competitions SET status = 'registration_closed' WHERE status = 'reg_closed';

-- Update constraint
ALTER TABLE tournament_competitions DROP CONSTRAINT IF EXISTS tournament_competitions_status_check CASCADE;
ALTER TABLE tournament_competitions ADD CONSTRAINT tournament_competitions_status_check 
CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled', 'pending', 'open', 'full'));
```

## RECOMMENDATION

**OPTION 1 (Safest)**: Leave as-is, document the convention
- Tournaments use `registration_open`/`registration_closed`
- Competitions use `reg_open`/`reg_closed`
- Update code to be explicit about which table is being queried

**OPTION 2 (Best Long-term)**: Full standardization
- Requires code changes in 8 critical files
- Requires database migration
- Risk: Breaking functionality during transition
- Benefit: Eliminates confusion permanently

## USER DECISION REQUIRED

Given the extensive use of both conventions across 40+ files, this is a MAJOR refactor.

**Do you want to:**
A) Standardize everything to `registration_open`/`registration_closed` (requires testing all features)
B) Leave as-is and just fix the immediate bugs (safer, document the difference)
C) Standardize gradually over multiple sessions with thorough testing

**Your call based on risk tolerance and available testing time.**

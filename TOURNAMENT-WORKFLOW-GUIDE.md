# Tournament Workflow - Complete Guide

## Overview
This guide documents the complete workflow for creating and managing tournaments, from initial creation through to player-facing display. **The Lifecycle Manager is the single source of truth for all timing.**

---

## Part 1: Creating a Tournament

### Step 1: Create New Tournament
**Location**: `http://localhost:3002/tournaments/new`

**Required Fields:**
- Tournament Name (e.g., "THE GREENIDGE OPEN")
- Slug (e.g., "the-greenidge-open")
- Timezone (e.g., "Europe/London")

**Optional Fields:**
- Description
- Location
- Start Date (can set later in Lifecycle Manager)
- End Date (can set later in Lifecycle Manager)
- Status (default: "draft")
- External ID (for API tracking)
- Image URL (e.g., `/images/tournaments/golf-bg-01.jpg`)

**Auto-Create Main Competitions:**
Check this box to automatically create 7 InPlay competitions:
1. Full Course (4 rounds)
2. Beat The Cut (Rounds 1-2)
3. THE WEEKENDER (Rounds 1-2)
4. First To Strike (Round 1 only)
5. Second Round (Round 2 only)
6. Third Round (Round 3 only)
7. Final Strike (Rounds 1-3)

**Click "Create Tournament"**

**Result:**
- Tournament created with status "draft"
- 7 competitions created (if auto-create checked)
- All competitions have status "draft" initially
- Tournament redirects to tournament list

---

## Part 2: Setting Up Tournament Details

### Option A: Tournament Settings Page
**Location**: `http://localhost:3002/tournaments/[id]`

**What You Can Set Here:**
- Basic info (name, slug, description, location)
- Image URL
- Timezone
- Status (draft/upcoming/registration_open/live/completed/cancelled)
- Featured competition (which comp shows on tournament card)
- Add/manage competitions
- Add/manage golfer groups
- **Note**: Dates are optional here - better to set in Lifecycle Manager

**Click "Save Changes"**

---

### Option B: Tournament Lifecycle Manager (RECOMMENDED)
**Location**: `http://localhost:3002/tournament-lifecycle`

**This is the SOURCE OF TRUTH for all timing**

#### What Gets Set in Lifecycle Manager:

**Tournament Dates:**
- Tournament Start Date (when Round 1 begins)
- Tournament End Date (when Round 4 completes, e.g., 18:00 same day)

**Registration Window:**
- Registration Opens At (typically 7 days before tournament)
- Registration Closes At (set manually or use "Auto from R4" button)

**Round Tee Times:**
- Round 1 Tee Time (e.g., 06:20 on Day 1)
- Round 2 Tee Time (e.g., 06:20 on Day 2)
- Round 3 Tee Time (e.g., 06:20 on Day 3)
- Round 4 Tee Time (e.g., 06:20 on Day 4)

**Helper Buttons:**
- **Auto from R4**: Sets Registration Closes At to 15 minutes before Round 4 tee time
- **Auto-Fill All Rounds**: Populates all 4 round tee times at 06:20 daily based on Tournament Start Date

**Click "Save Registration Times"**

---

## Part 3: How Competition Times Are Calculated

### Automatic Calculation
When you save in Lifecycle Manager or click "Calculate Times" on tournament settings page:

**API Endpoint**: `/api/tournaments/[id]/competitions/calculate-times`

**Logic:**
1. Reads `round_1_start`, `round_2_start`, `round_3_start`, `round_4_start` from tournament
2. For each competition, finds which round it starts on (via `competition_types.round_start`)
3. Sets `competition.reg_close_at` = Round Start Time - 15 minutes
4. Sets `competition.reg_open_at` = Tournament Registration Opens
5. Auto-calculates status based on current time vs reg_close_at

**Competition Closing Times (Example):**
```
Tournament: Jan 2-5, 2026
Round 1: Jan 2 06:20
Round 2: Jan 3 06:20
Round 3: Jan 4 06:20
Round 4: Jan 5 06:20

Competition Close Times:
- Full Course: Jan 2 06:05 (15min before R1)
- Beat The Cut: Jan 2 06:05 (15min before R1)
- First To Strike: Jan 2 06:05 (15min before R1)
- Second Round: Jan 3 06:05 (15min before R2)
- Third Round: Jan 4 06:05 (15min before R3)
- THE WEEKENDER: Jan 4 06:05 (15min before R3)
- Final Strike: Jan 5 06:05 (15min before R4)
```

**Each competition shows its own unique countdown to registration close.**

---

## Part 4: Tournament Status Management

### Tournament Statuses (Database Values)
- `draft` - Not visible to players
- `upcoming` - Visible, registration not yet open
- `registration_open` - Visible, players can enter
- `registration_closed` - Visible, entries closed, not yet started
- `live` - Tournament rounds in progress
- `completed` - All rounds finished
- `cancelled` - Cancelled

### Competition Statuses (Database Values)
- `draft` - Not visible to players
- `upcoming` - Visible, registration not yet open
- `registration_open` - Registration currently open
- `reg_open` - Same as registration_open (legacy, both supported)
- `live` - Registration closed, tournament in progress
- `completed` - Tournament finished
- `cancelled` - Cancelled

### Status Auto-Calculation
The system has an auto-update endpoint: `/api/tournaments/auto-update-statuses`

**This should be run via cron job every hour** to:
1. Open registration when `registration_opens_at` time passes
2. Close registration when `registration_closes_at` time passes
3. Mark tournament as live when `start_date` passes
4. Mark tournament as completed when `end_date` passes

**Vercel Cron Setup** (in `vercel.json`):
```json
{
  "crons": [{
    "path": "/api/tournaments/auto-update-statuses",
    "schedule": "0 * * * *"
  }]
}
```

---

## Part 5: Where Tournaments Appear (Player-Facing)

### A. Tournaments Page (`http://localhost:3003/tournaments`)

**Top Slider:**
Shows tournaments where:
- Tournament status is NOT 'draft'
- Has at least one competition with status `'registration_open'`, `'reg_open'`, OR `'live'`
- Displays featured competition or Full Course

**Competition Grid Below:**
Shows individual competitions where:
- Tournament status is NOT 'draft'
- Competition format = 'inplay' (excludes ONE 2 ONE)
- Registration is currently open (`now < reg_close_at`)
- If `reg_open_at` exists, checks `now >= reg_open_at`

**Filters:**
- Main Competitions toggle (Full Course, Beat The Cut, THE WEEKENDER)
- Competition type filter (all/full-course/beat-the-cut/etc)
- Sort by (prize pool, entry fee, start date)

**Each Competition Card Shows:**
- Competition name
- Entry fee
- Prize pool (calculated from entrants_cap × entry_fee × (1 - admin_fee_percent))
- Entrants cap
- Tournament name and dates
- Registration countdown timer (to `reg_close_at`)
- Status badge (Registration Open/Live/etc)

---

### B. Tournament Detail Page (`http://localhost:3003/tournaments/[slug]`)

**Shows:**
- Tournament header (name, dates, location, tour badge)
- Tournament details section
- All competitions for this tournament sorted by:
  - Open competitions first (registration not closed)
  - Closed competitions at bottom
  - Within each group, sorted by type order (Full Course → Beat The Cut → etc)

**Each Competition Shows:**
- Status badge (based on `getStatusBadge()` logic)
- Entry fee, entrants cap, admin fee
- Prize pool calculation
- Registration countdown (or "Starts in..." if reg closed but comp not started)
- "Enter Competition" button (if registration open)

**Status Badge Logic (Priority Order):**
1. If tournament ended → "Completed"
2. If competition cancelled → "Cancelled"
3. If registration is open by dates → "Registration Open"
4. If registration closed but comp hasn't started → "Awaiting Start"
5. If competition started but not ended → "Live"
6. Fallback to database status

---

### C. ONE 2 ONE Page (`http://localhost:3003/one-2-one`)

**Shows:**
- Tournaments where:
  - Tournament status is NOT 'draft'
  - Tournament `end_date` is in the future
  - Has ONE 2 ONE templates/instances available

**Displays:**
- Tournament cards to select for head-to-head challenges
- User creates their team, then finds opponent on challenge board

---

### D. Lobby/Home Page (`http://localhost:3003/`)

**Featured Tournaments Section:**
Shows tournaments where:
- Status is `'registration_open'` OR `'live'`
- Sorted by start date

**Quick Enter Competitions:**
Shows competitions across all tournaments where:
- Registration is currently open
- Format = 'inplay'

---

## Part 6: Competition Visibility Rules

### Frontend Filtering Logic

**Tournaments Page Slider** (`apps/golf/src/app/tournaments/page.tsx` lines 409-438):
```typescript
tournament.competitions?.some(c => {
  if (c.status === 'registration_open' || c.status === 'reg_open' || c.status === 'live') {
    return true;
  }
  // Also checks dates...
})
```

**Tournaments Page Grid** (`apps/golf/src/app/tournaments/page.tsx` lines 538-567):
```typescript
.filter(c => {
  const now = new Date();
  if (!c.reg_close_at) return false;
  const closeDate = new Date(c.reg_close_at);
  if (now >= closeDate) return false; // Registration closed
  
  if (c.reg_open_at) {
    const openDate = new Date(c.reg_open_at);
    if (now < openDate) return false; // Not started yet
  }
  
  return true; // Registration is open
})
```

**API Filter** (`apps/golf/src/app/api/tournaments/route.ts` line 33):
```typescript
.eq('is_visible', true)
.neq('status', 'draft') // Excludes draft tournaments
```

---

## Part 7: Image Display

**Image URL Field:**
Can be set in:
- Tournament creation form
- Tournament settings page
- Lifecycle Manager doesn't handle images

**Supported Formats:**
- Relative path: `/images/tournaments/golf-bg-01.jpg`
- Absolute URL: `https://example.com/image.jpg`

**Where Images Appear:**
- Tournament card on tournaments page
- Tournament header on detail page
- ONE 2 ONE tournament selection
- Slider on tournaments page

**If No Image:**
- Tournament cards show without image
- Detail page shows without header image

---

## Part 8: Golfer Management

### Golfer Groups
**Location**: `http://localhost:3002/golfers/groups`

**Purpose:** Control which golfers are available for each competition

**Workflow:**
1. Create golfer group (e.g., "PGA Tour Players")
2. Add golfers to group
3. Assign group to tournament (on tournament settings page)
4. When creating/editing competition, select assigned group
5. Only golfers in that group are available for team building

**Validation:**
System checks `golfer_group_members` when user creates entry to ensure selected golfers are valid.

---

## Part 9: Entry Creation Flow

### Player Perspective

**Step 1: Find Competition**
- Browse tournaments page
- Click competition card OR
- Click tournament → view detail page → click competition

**Step 2: Build Team**
Redirects to: `/build-team/[competitionId]`

**Validation Checks:**
1. User is authenticated
2. Competition registration is open (`now < reg_close_at` AND `now >= reg_open_at`)
3. Competition hasn't reached entrants cap
4. User hasn't already entered this competition
5. User has sufficient wallet balance

**Step 3: Select 6 Golfers + 1 Captain**
- Only golfers from assigned golfer group are available
- Captain scores double points
- Real-time validation against rules

**Step 4: Purchase**
- Checks wallet balance
- Calls `wallet_apply()` RPC function to deduct entry fee
- Creates `competition_entries` record
- Creates `competition_entry_picks` records (7 golfers)

**Result:**
- Entry confirmed
- Wallet debited
- User can view entry on "My Entries" page

---

## Part 10: Common Issues & Solutions

### Issue: Competitions Not Showing on Tournaments Page

**Possible Causes:**
1. Tournament status is 'draft' → Change to 'registration_open' in Lifecycle Manager
2. Competition registration has closed → Check `reg_close_at` dates
3. Registration hasn't opened yet → Check `reg_open_at` date
4. Competition format is 'one2one' → Only InPlay appears on tournaments page

**Solution:**
- Go to Lifecycle Manager
- Set appropriate dates
- Click "Save Registration Times"
- Run calculate times: `node trigger-calculate-times.js`

---

### Issue: All Competitions Show Same Countdown

**Cause:** Competition `reg_close_at` times are all the same

**Solution:**
- Ensure tournament has different round tee times set
- Run `/api/tournaments/[id]/competitions/calculate-times`
- OR click "Calculate Times" button on tournament settings page
- System will auto-calculate based on each competition's starting round

---

### Issue: "Registration Closed" But Tournament Hasn't Started

**Cause:** `reg_close_at` date is in the past

**Solution:**
- Go to Lifecycle Manager
- Set Round Tee Times to future dates
- Click "Auto-Fill All Rounds" to set 4 consecutive days
- Click "Save Registration Times"
- System auto-calculates competition close times

---

### Issue: Draft Tournaments Appearing on Frontend

**Cause:** Old code didn't filter by status

**Fix Applied:** Added `.neq('status', 'draft')` to API route

**Verification:**
- Check `/api/tournaments` response
- Draft tournaments should not appear

---

### Issue: Status Shows "Draft" Badge on Detail Page

**Cause:** Missing status key in `statusConfig` object

**Fix Applied:** Added `'registration_open'` key to statusConfig

**Location:** `apps/golf/src/app/tournaments/[slug]/page.tsx` line 604

---

## Part 11: Testing Checklist

When creating a new tournament for testing:

### Checklist:
- [ ] Create tournament with name and slug
- [ ] Auto-create 7 main competitions
- [ ] Upload/set tournament image
- [ ] Go to Lifecycle Manager
- [ ] Set Tournament Start Date (4 days in future)
- [ ] Set Tournament End Date (last day of tournament, 18:00)
- [ ] Click "Auto-Fill All Rounds" (sets 4 consecutive days at 06:20)
- [ ] Set Registration Opens At (e.g., 7 days before tournament)
- [ ] Click "Auto from R4" OR manually set Registration Closes At
- [ ] Click "Save Registration Times"
- [ ] Verify on frontend: Tournament appears in slider
- [ ] Verify on frontend: Competitions show different countdown times
- [ ] Change status to 'registration_open' if needed
- [ ] Create test golfer group and assign to tournament
- [ ] Test entry creation flow

---

## Part 12: Key Files Reference

### Admin Files (Tournament Management)
- `/apps/admin/src/app/tournaments/new/page.tsx` - Create tournament
- `/apps/admin/src/app/tournaments/[id]/page.tsx` - Tournament settings
- `/apps/admin/src/app/tournament-lifecycle/page.tsx` - **SOURCE OF TRUTH for timing**
- `/apps/admin/src/app/api/tournaments/route.ts` - Tournament CRUD
- `/apps/admin/src/app/api/tournament-lifecycle/[id]/registration/route.ts` - Save timing
- `/apps/admin/src/app/api/tournaments/[id]/competitions/calculate-times/route.ts` - Auto-calc

### Player-Facing Files
- `/apps/golf/src/app/tournaments/page.tsx` - Main tournaments page (slider + grid)
- `/apps/golf/src/app/tournaments/[slug]/page.tsx` - Tournament detail page
- `/apps/golf/src/app/one-2-one/page.tsx` - ONE 2 ONE lobby
- `/apps/golf/src/app/build-team/[competitionId]/page.tsx` - Team builder
- `/apps/golf/src/app/api/tournaments/route.ts` - Public tournament API

### Database Tables
- `tournaments` - Main tournament records
- `tournament_competitions` - Competition records (InPlay format)
- `competition_types` - Competition type definitions (Full Course, etc)
- `competition_entries` - User entries
- `competition_entry_picks` - Golfer selections per entry
- `golfer_groups` + `golfer_group_members` - Available golfer restrictions

---

## Part 13: Quick Command Reference

### Trigger Competition Time Calculation
```bash
node trigger-calculate-times.js
```

### Check Tournament Competition Statuses
```bash
node check-tournament-comps.js
```

### Check Round Tee Times
```bash
node check-round-times.js
```

### Check Competition Format Field
```bash
node check-competition-format.js
```

### Test API Response
```bash
node test-tournaments-api.js
```

---

## Summary: The Golden Rule

**THE LIFECYCLE MANAGER IS THE SINGLE SOURCE OF TRUTH**

1. Create tournament (minimal info)
2. Set ALL dates/times in Lifecycle Manager
3. System auto-calculates competition registration times
4. Frontend displays based on calculated times
5. Status auto-updates via cron job

**Never manually set competition `reg_close_at` times in database. Always use Lifecycle Manager → Calculate Times.**

---

End of Document

# Build Your Team System - Complete Implementation ✅

## Overview
The "Build Your Team" page allows users to select 6 golfers from a competition's available golfer pool, staying within a £50,000 salary cap, and designate one as captain (2x points).

---

## 🗄️ Database Schema

### New Tables Created (`scripts/2025-01-team-builder-tables.sql`)

#### 1. **competition_entries**
Stores user entries for specific competitions.

**Columns:**
- `id` (UUID, PK) - Unique entry ID
- `user_id` (UUID, FK → auth.users) - User who created the entry
- `competition_id` (UUID, FK → tournament_competitions) - Competition being entered
- `entry_name` (TEXT, optional) - Custom team name (e.g., "Tiger's Revenge")
- `total_salary` (INTEGER) - Sum of all selected golfer salaries
- `entry_fee_paid` (INTEGER) - Amount paid in pennies
- `captain_golfer_id` (UUID, FK → golfers) - Which golfer is captain (2x points)
- `status` (TEXT) - 'draft', 'submitted', 'paid', 'cancelled'
- `created_at`, `updated_at`, `submitted_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, competition_id) - One entry per user per competition
- CHECK(status IN ('draft', 'submitted', 'paid', 'cancelled'))

#### 2. **entry_picks**
Links specific golfers to entries (the user's team).

**Columns:**
- `id` (UUID, PK)
- `entry_id` (UUID, FK → competition_entries) - Which entry
- `golfer_id` (UUID, FK → golfers) - Which golfer was selected
- `slot_position` (INTEGER, 1-6) - Position in lineup
- `salary_at_selection` (INTEGER) - Frozen salary when picked
- `added_at` (TIMESTAMPTZ)

**Constraints:**
- PRIMARY KEY (entry_id, golfer_id) - No duplicate golfers in same entry
- UNIQUE(entry_id, slot_position) - One golfer per slot
- CHECK(slot_position >= 1 AND slot_position <= 6)

#### 3. **competition_golfers** (Enhanced)
Added `salary` column to existing table so each competition can set different salaries for golfers.

**New Column:**
- `salary` (INTEGER, DEFAULT 5000) - Fantasy salary for this golfer in this competition

---

## 📂 Frontend Structure

### Page Location
**File:** `apps/golf/src/app/build-team/[competitionId]/page.tsx`
**Route:** `/build-team/[competitionId]`

### Features Implemented
✅ **Live Database Integration**
- Fetches golfers assigned to the competition from `competition_golfers`
- Loads existing draft entries if user has one
- Saves/updates entries and picks in real-time

✅ **Salary Cap System**
- £50,000 budget
- Real-time budget tracking
- Budget health indicators (Excellent, Good, Tight, Critical)
- Average salary calculation
- Prevents selecting unaffordable golfers

✅ **Smart Filtering & Sorting**
- Search by golfer name
- Filter by salary range (Premium £10K+, Mid-Range, Value <£7K)
- Sort by ranking, salary, points, or name
- Only shows affordable golfers based on remaining budget

✅ **Captain Selection**
- Designate one golfer as captain (2x points)
- Visual gold badge with animation for captain
- Must have captain selected before submitting

✅ **Draft & Submit Flow**
1. **Draft Mode** - Save progress anytime, resume later
2. **Submit Mode** - Finalize team, proceed to payment
3. Auto-loads existing draft on page visit

✅ **Responsive Design**
- Two-panel layout (golfers list + lineup)
- Glass morphism styling matching app theme
- Mobile-friendly with stacked layout
- Smooth animations and transitions

---

## 🔌 API Endpoints

### 1. GET `/api/competitions/[competitionId]`
**Purpose:** Fetch competition details (name, entry fee, dates, etc.)

**Returns:**
```typescript
{
  id: string;
  tournament_id: string;
  competition_type_name: string; // "Round 1", "Round 2", etc.
  tournament_name: string; // "Masters 2025"
  entry_fee_pennies: number;
  entrants_cap: number;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string;
  end_at: string;
}
```

---

### 2. GET `/api/competitions/[competitionId]/golfers`
**Purpose:** Fetch all golfers available in this competition with their salaries

**Returns:**
```typescript
[
  {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    world_ranking: number | null;
    points_won: number | null;
    image_url: string | null;
    salary: number; // From competition_golfers.salary
  },
  ...
]
```

**Database Query:**
```sql
SELECT 
  cg.salary,
  g.id, g.first_name, g.last_name, g.full_name, 
  g.world_ranking, g.points_won, g.image_url
FROM competition_golfers cg
JOIN golfers g ON cg.golfer_id = g.id
WHERE cg.competition_id = ?
ORDER BY g.world_ranking ASC NULLS LAST;
```

---

### 3. GET `/api/competitions/[competitionId]/my-entry`
**Purpose:** Fetch user's existing entry (if any) for this competition

**Returns:**
```typescript
{
  id: string;
  entry_name: string | null;
  total_salary: number;
  captain_golfer_id: string | null;
  status: 'draft' | 'submitted' | 'paid' | 'cancelled';
  picks: [
    {
      golfer_id: string;
      slot_position: number; // 1-6
      salary_at_selection: number;
    },
    ...
  ]
} | null
```

**Business Logic:**
- Returns `null` if no entry exists
- Only returns entries where `user_id = current_user.id`
- Includes all picks joined from `entry_picks` table

---

### 4. POST `/api/competitions/[competitionId]/entries`
**Purpose:** Create a new entry (draft or submitted)

**Request Body:**
```typescript
{
  entry_name?: string | null; // Optional team name
  total_salary: number; // Required
  captain_golfer_id?: string | null; // Required for submit, optional for draft
  status: 'draft' | 'submitted'; // Default: 'draft'
  picks: [
    {
      golfer_id: string;
      slot_position: number; // 1-6
      salary_at_selection: number;
    },
    ...
  ]
}
```

**Response:**
```typescript
{
  success: true;
  entry_id: string;
  message: 'Entry submitted successfully' | 'Draft created';
}
```

**Validations:**
- User must be authenticated
- User cannot already have an entry for this competition (returns 400)
- `status` must be 'draft' or 'submitted'
- All picks are inserted in a single transaction

---

### 5. PUT `/api/competitions/[competitionId]/my-entry`
**Purpose:** Update an existing draft entry

**Request Body:** Same as POST

**Response:** Same as POST

**Validations:**
- Entry must exist and belong to current user
- Can only update entries with `status = 'draft'`
- Cannot update submitted or paid entries
- Old picks are deleted and new picks are inserted

**Workflow:**
1. Verify entry exists and belongs to user
2. Check status is 'draft'
3. Update entry record
4. Delete all old picks
5. Insert new picks
6. If status = 'submitted', set `submitted_at` timestamp

---

## 🎯 User Flow

### Step 1: Access Build Team Page
- User navigates from tournament/competition page
- URL: `/build-team/[competitionId]`
- Page loads competition details and available golfers

### Step 2: Check for Existing Draft
- API checks if user has an existing entry
- If draft exists, it auto-loads:
  - Team name
  - Selected golfers
  - Captain selection
  - Budget calculations

### Step 3: Build Team
**Actions Available:**
- Search golfers by name
- Filter by salary range
- Sort by ranking, salary, points, or name
- Click "+" button to add golfer to lineup
- Select captain by clicking crown button
- Remove golfer by clicking "×" button
- Clear all selections

**Real-time Feedback:**
- Budget remaining updates instantly
- Budget health indicator (color-coded)
- Average salary per golfer
- Progress bar (% of budget used)
- Golfers above remaining budget are hidden

### Step 4: Save Draft (Optional)
- Click "Save Draft" button
- Entry saved with `status = 'draft'`
- User can leave and return later to continue

### Step 5: Submit Lineup
**Requirements:**
- All 6 slots filled
- Captain selected
- Within salary cap

**Click "Submit Lineup":**
- Confirmation dialog shows entry fee
- Entry saved with `status = 'submitted'`
- Redirects to payment page (TODO)

---

## 🔒 Security (RLS Policies)

### competition_entries
```sql
-- Users can view their own entries
CREATE POLICY "Users can view their own competition entries"
  ON competition_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own entries
CREATE POLICY "Users can create their own competition entries"
  ON competition_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft entries
CREATE POLICY "Users can update their own draft entries"
  ON competition_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');
```

### entry_picks
```sql
-- Users can view picks for their own entries
CREATE POLICY "Users can view picks for their own entries"
  ON entry_picks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competition_entries ce
      WHERE ce.id = entry_picks.entry_id
      AND ce.user_id = auth.uid()
    )
  );

-- Users can add picks to their own entries
CREATE POLICY "Users can add picks to their own entries"
  ON entry_picks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competition_entries ce
      WHERE ce.id = entry_picks.entry_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'draft'
    )
  );

-- Users can delete picks from their own draft entries
CREATE POLICY "Users can delete picks from their own draft entries"
  ON entry_picks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competition_entries ce
      WHERE ce.id = entry_picks.entry_id
      AND ce.user_id = auth.uid()
      AND ce.status = 'draft'
    )
  );
```

---

## 📊 Admin Integration

### Setting Golfer Salaries
**Location:** Admin Panel → Tournaments → [Tournament] → Competitions → [Competition] → Golfers

**Workflow:**
1. Admin assigns golfer groups to tournament
2. Admin creates competition (Round 1, Round 2, etc.)
3. Admin selects which golfers are available in each competition
4. Admin sets salary for each golfer in that competition
5. Users see these salaries when building their teams

**Example:**
- Scottie Scheffler in Round 1: £12,500
- Scottie Scheffler in Round 4: £14,000 (adjusted based on performance)

---

## ✅ Testing Checklist

### Database
- [ ] Run migration: `scripts/2025-01-team-builder-tables.sql`
- [ ] Verify tables created: `competition_entries`, `entry_picks`
- [ ] Verify `competition_golfers.salary` column added
- [ ] Test RLS policies

### Backend APIs
- [ ] GET `/api/competitions/[id]` returns competition details
- [ ] GET `/api/competitions/[id]/golfers` returns golfers with salaries
- [ ] GET `/api/competitions/[id]/my-entry` returns user's entry or null
- [ ] POST `/api/competitions/[id]/entries` creates new entry
- [ ] PUT `/api/competitions/[id]/my-entry` updates draft entry
- [ ] Verify cannot update submitted entries
- [ ] Verify one entry per user per competition

### Frontend
- [ ] Build team page loads without errors
- [ ] Competition details display correctly
- [ ] Golfers list populates from database
- [ ] Search filter works
- [ ] Salary filters work
- [ ] Sort dropdown works
- [ ] Add golfer button works
- [ ] Remove golfer button works
- [ ] Captain selection works
- [ ] Budget calculations are accurate
- [ ] Save draft button works
- [ ] Submit lineup button works (when 6 golfers + captain)
- [ ] Existing draft loads on page refresh
- [ ] Mobile responsive layout

---

## 🚀 Next Steps

### Payment Integration
1. Create payment page for submitted entries
2. Integrate Stripe/payment gateway
3. Update entry status to 'paid' after successful payment
4. Deduct entry fee from user's wallet balance

### Scoring System
1. Create live scoring tables
2. Track golfer performance during tournament
3. Calculate fantasy points (including 2x for captain)
4. Update leaderboards in real-time

### Entry Management
1. Create "My Entries" page showing all user's entries
2. Allow viewing submitted lineups
3. Show live scores for active entries
4. Display final results and winnings

### Admin Features
1. Bulk set salaries for all golfers
2. Salary import from CSV
3. Automated salary calculation based on world ranking
4. View all entries for a competition
5. Export entries to CSV

---

## 📝 Notes

- **Salary Frozen:** When a golfer is selected, their salary is frozen in `entry_picks.salary_at_selection`. This prevents issues if admin changes salaries after selection.
- **One Entry Per Competition:** Users can only have one entry per competition. This is enforced by UNIQUE constraint.
- **Draft Auto-Save:** Consider adding auto-save every 30 seconds to prevent data loss.
- **Captain Requirement:** Captain is optional for drafts but required for submission.
- **Budget Validation:** Frontend validates budget, but backend should also validate before saving to prevent cheating.

---

## 🐛 Known Issues / TODOs

- [ ] Add backend validation for salary cap (currently only frontend)
- [ ] Add backend validation for captain being in the 6 selected golfers
- [ ] Implement payment integration
- [ ] Add loading states during save/submit
- [ ] Add success toast notifications
- [ ] Add entry name character limit validation
- [ ] Implement auto-save for drafts
- [ ] Add "Undo" button for recent actions
- [ ] Add golfer stats modal (detailed info popup)
- [ ] Add "Optimal Team" suggestion feature

---

## 📚 Related Documentation

- `GOLFERS-CSV-GUIDE.md` - How to import golfers
- `TOURNAMENT-GOLFERS-COMPLETE.md` - Golfer groups system
- `GOLFER-GROUPS-PLAN.md` - Architecture of golfer management
- Database migrations: `scripts/2025-01-team-builder-tables.sql`

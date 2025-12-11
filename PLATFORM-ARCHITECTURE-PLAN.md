# Platform Architecture Plan - Separation of Concerns

## Current Problems Identified

1. **Two Tournament Management Systems** (conflicting/confusing)
2. **Mixed Terminology** (live vs inplay vs in-play)
3. **Blurred Boundaries** (tournaments mixed with 1-on-1 challenges)
4. **Two Leaderboard Systems** (real tournament vs fantasy InPlay)

---

## Recommended Architecture

### 1. TOURNAMENT LIFECYCLE MANAGEMENT

**Single Source of Truth: Lifecycle Manager**

Make Admin → Lifecycle Manager the ONLY place to control tournament states.

**Why:**
- Visual dashboard shows everything
- Clear status transitions
- Automated + manual control
- Already has good UI

**Remove/Simplify:**
- Admin → All Tournaments → Keep for basic CRUD only (name, description, image)
- Remove status controls from All Tournaments page
- Redirect status management to Lifecycle Manager

**Status Flow:**
```
UPCOMING → REGISTRATION_OPEN → REGISTRATION_CLOSED → LIVE → COMPLETED
```

**Triggers:**
- **Automated**: Cron job checks dates every 5 minutes
- **Manual Override**: Lifecycle Manager buttons for emergency control

---

### 2. CLEAR SEPARATION OF FEATURES

#### A. **Real PGA Tournaments** (Tournament System)
**Database:** `tournaments`, `competitions`, `tournament_rounds`
**Pages:**
- `/tournaments` - List of real PGA tournaments
- `/tournaments/[slug]` - Tournament detail + entry
**Leaderboard:** RIGHT SIDE - Real player scores from PGA data
**Status:** `live`, `registration_open`, etc.

#### B. **Fantasy InPlay Competitions** (Competition System)
**Database:** `competitions`, `user_entries`, `user_lineups`
**Pages:**
- `/competitions` - List of fantasy competitions
- `/team-builder` - Build fantasy team
**Leaderboard:** LEFT SIDE - User fantasy scores
**Status:** `in_play`, `pending`, `completed`

#### C. **1-on-1 Challenges** (Challenge System)
**Database:** `challenge_instances` (separate table)
**Pages:**
- `/challenges` - Challenge lobby
- `/challenges/[id]` - Specific challenge
**Completely separate** - No mixing with tournaments/competitions

---

### 3. NAMING CONVENTIONS (Critical!)

**Real Tournament Status (PGA Events):**
- `upcoming` - Not started yet
- `registration_open` - Can enter
- `registration_closed` - Locked
- `live` - Tournament happening now
- `completed` - Tournament finished

**Fantasy Competition Status (User's game):**
- `pending` - Not started
- `in_play` - Currently active (user's game is live)
- `completed` - Finished
- `cancelled` - Cancelled

**Database Fields:**
- `tournaments.status` → Real tournament status
- `competitions.status` → Fantasy game status
- `user_entries.status` → User's entry status

**Frontend Display:**
- "Live" badge → Real tournament is happening
- "In Play" badge → User's fantasy game is active
- Never mix these terms

---

### 4. LEADERBOARD SYSTEM

#### Tournament Leaderboard (Right Side)
**Purpose:** Show real PGA player scores
**Data Source:** `player_scores`, `tournament_rounds`
**Key:** `player_id`
**Updates:** From external PGA data feed

#### InPlay Leaderboard (Left Side)  
**Purpose:** Show user fantasy scores
**Data Source:** `user_entries`, `user_lineups`, calculated scores
**Key:** `user_id`
**Updates:** Calculated from user's golfer selections

**Critical:** These NEVER overlap. Different data, different purpose.

---

### 5. MY SCORECARD PAGE

**Status:** Working well ✅
**Keep:** Current functionality
**Purpose:** User's personal view of:
- Purchased entries
- Team selections
- Live scores
- Historical results

---

## Implementation Plan

### Phase 1: Fix Immediate Tournament Issue (NOW)
1. ✅ Update API to include all status values
2. ⏳ Run SQL to fix current tournament statuses
3. ⏳ Verify tournaments appear on `/tournaments` page
4. ⏳ Test that competitions show correct status

### Phase 2: Consolidate Tournament Management (Next)
1. Make Lifecycle Manager the primary control
2. Simplify All Tournaments page (remove status controls)
3. Add clear documentation which system does what
4. Add countdown timers to Lifecycle Manager

### Phase 3: Naming Cleanup (Important)
1. Audit all uses of "live", "in-play", "inplay"
2. Update database column comments
3. Update frontend labels consistently
4. Update API documentation

### Phase 4: Separate 1-on-1 Challenges (If not already)
1. Verify challenge_instances table is separate
2. Ensure no mixing with tournaments/competitions
3. Clear UI separation

### Phase 5: Leaderboard Clarity (Polish)
1. Add visual separation (different colors?)
2. Clear labels: "PGA Leaderboard" vs "Fantasy Leaderboard"
3. Ensure data sources never mix

---

## Immediate Action Required

Run these in Supabase SQL Editor:

```sql
-- 1. Check current tournament statuses
SELECT 
  name,
  status,
  is_visible,
  registration_start,
  registration_end,
  start_date,
  end_date
FROM tournaments
WHERE is_visible = true
ORDER BY start_date;

-- 2. Fix any tournaments with wrong status
UPDATE tournaments 
SET 
  status = CASE
    WHEN registration_start > NOW() THEN 'upcoming'
    WHEN registration_start <= NOW() AND registration_end > NOW() THEN 'registration_open'
    WHEN registration_end <= NOW() AND start_date > NOW() THEN 'registration_closed'
    WHEN start_date <= NOW() AND end_date > NOW() THEN 'live'
    ELSE 'completed'
  END
WHERE is_visible = true;

-- 3. Verify the fix
SELECT status, COUNT(*) FROM tournaments WHERE is_visible = true GROUP BY status;
```

After running this, tournaments should appear on your `/tournaments` page!

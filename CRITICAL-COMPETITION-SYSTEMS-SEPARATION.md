# ⚠️ CRITICAL: TWO SEPARATE COMPETITION SYSTEMS ⚠️

## DO NOT MIX THESE SYSTEMS - THEY ARE COMPLETELY SEPARATE

---

## 🎯 SYSTEM 1: INPLAY COMPETITIONS (Main Tournament Competitions)

**Database Tables:**
- `tournament_competitions` - Competition definitions
- `competition_entries` WHERE `competition_id IS NOT NULL AND instance_id IS NULL`
- `entry_picks` - Team selections (6 golfers)
- `competition_golfers` - Available golfers with salaries

**Key Fields:**
- `competition_entries.competition_id` → Links to `tournament_competitions.id`
- `competition_entries.captain_golfer_id` → Which golfer is captain (stored in entries table)
- `competition_entries.instance_id` → **MUST BE NULL**

**How It Works:**
- Users enter regular fantasy competitions
- Pick 6 golfers within salary cap
- Choose 1 captain (2x points)
- Compete against ALL other entries in that competition
- Multiple users in same competition

**Team Structure:**
- 6 golfers selected from `entry_picks` table
- Captain determined by `competition_entries.captain_golfer_id`
- Salary tracked in `competition_entries.total_salary`

**API Endpoints:**
- `/api/competitions/[competitionId]/*`
- `/api/team-builder/*`

**Pages:**
- `/tournaments` - List view
- `/tournaments/[slug]` - Tournament detail
- `/team-builder/[competitionId]` - Build team
- `/entries` - View my entries

---

## 🥊 SYSTEM 2: ONE 2 ONE CHALLENGES (Head-to-Head Matches)

**Database Tables:**
- `competition_instances` - Individual challenge matches
- `competition_entries` WHERE `instance_id IS NOT NULL AND competition_id IS NULL`
- `entry_picks` - Team selections (6 golfers each)
- `competition_golfers` - Available golfers with salaries

**Key Fields:**
- `competition_entries.instance_id` → Links to `competition_instances.id`
- `competition_entries.golfer_id` → Which golfer is captain (same as InPlay)
- `competition_entries.competition_id` → **MUST BE NULL**
- `competition_instances.tournament_id` → Links to tournament (NOT competition)

**How It Works:**
- Head-to-head challenges between EXACTLY 2 users
- Each user picks 6 golfers (same as InPlay)
- Each user chooses 1 captain (2x points)
- Winner determined by which team scores better
- Instances fill up (max 2 players) and auto-spawn new ones

**Team Structure:**
- 6 golfers selected from `entry_picks` table (SAME AS INPLAY)
- Captain determined by `competition_entries.golfer_id` (SAME AS INPLAY)
- Salary tracked in `competition_entries.total_salary` (SAME AS INPLAY)

**API Endpoints:**
- `/api/one-2-one/*`
- `/api/challenges/*`

**Pages:**
- `/one-2-one` - Challenge board
- `/one-2-one/challenge/[instanceId]` - Challenge detail
- `/one-2-one/create` - Create challenge

---

## 🚨 CRITICAL CHECKS BEFORE MAKING ANY CHANGES

### When working on InPlay Competitions:
```typescript
// ✅ CORRECT - InPlay
SELECT * FROM competition_entries 
WHERE competition_id IS NOT NULL 
  AND instance_id IS NULL;

// ✅ Get team picks (6 golfers)
SELECT * FROM entry_picks 
WHERE entry_id = 'xxx';

// ✅ Get captain
SELECT golfer_id as captain_golfer_id
FROM competition_entries 
WHERE id = 'xxx';
```

### When working on ONE 2 ONE:
```typescript
// ✅ CORRECT - ONE 2 ONE
SELECT * FROM competition_entries 
WHERE instance_id IS NOT NULL 
  AND competition_id IS NULL;

// ✅ Get team picks (6 golfers - SAME AS INPLAY)
SELECT * FROM entry_picks 
WHERE entry_id = 'xxx';

// ✅ Get captain (SAME AS INPLAY)
SELECT golfer_id as captain_golfer_id
FROM competition_entries 
WHERE instance_id = 'xxx';
```

---

## 🔍 HOW TO IDENTIFY WHICH SYSTEM YOU'RE WORKING ON

**Check the URL/Page:**
- Contains `/one-2-one/` → ONE 2 ONE system
- Contains `/tournaments/` or `/team-builder/` → InPlay system
- Contains `/entries` → Could be BOTH (filter by competition_id vs instance_id)

**Check the Database Query:**
- Has `competition_id` → InPlay system
- Has `instance_id` → ONE 2 ONE system
- Has BOTH → ERROR - cannot have both!

**Check the File Path:**
- `apps/golf/src/app/one-2-one/*` → ONE 2 ONE system
- `apps/golf/src/app/tournaments/*` → InPlay system
- `apps/golf/src/app/team-builder/*` → InPlay system

---

## ❌ COMMON MISTAKES TO AVOID

### Mistake 1: Querying entry_picks for ONE 2 ONE
```typescript
// ❌ WRONG
const { data: picks } = await supabase
  .from('entry_picks')
  .select('*')
  .eq('entry_id', oneToOneEntryId); // ONE 2 ONE has no picks!

// ✅ CORRECT
const { data: entry } = await supabase
  .from('competition_entries')
  .select('golfer_id, golfers(*)')
  .eq('instance_id', instanceId);
```

### Mistake 2: Looking for captain in ONE 2 ONE
```typescript
// ❌ WRONG
const captainId = entry.captain_golfer_id; // Not used in ONE 2 ONE

// ✅ CORRECT
const golferId = entry.golfer_id; // The only golfer
```

### Mistake 3: Mixing competition_id and instance_id
```typescript
// ❌ WRONG
WHERE competition_id = 'xxx' AND instance_id = 'yyy'

// ✅ CORRECT - Pick ONE
WHERE competition_id = 'xxx' AND instance_id IS NULL // InPlay
WHERE instance_id = 'yyy' AND competition_id IS NULL // ONE 2 ONE
```

---

## 📋 QUICK REFERENCE TABLE

| Feature | InPlay Competitions | ONE 2 ONE Challenges |
|---------|---------------------|----------------------|
| **Table** | `tournament_competitions` | `competition_instances` |
| **Entry Link** | `competition_id` | `instance_id` |
| **Golfers** | 6 golfers (team) | 6 golfers (team) |
| **Team Picks** | `entry_picks` table | `entry_picks` table |
| **Captain** | `golfer_id` field | `golfer_id` field |
| **Salary Cap** | Yes (£50,000) | Yes (£50,000) |
| **Players** | Many users (pool) | Exactly 2 users (head-to-head) |
| **Scoring** | Team total + bonuses | Team total + bonuses |

**THE ONLY DIFFERENCE:** InPlay = many users in a pool, ONE 2 ONE = 2 users head-to-head

---

## 🛡️ BEFORE ANY CODE CHANGE - ASK YOURSELF:

1. **Which system am I modifying?**
   - InPlay Competitions?
   - ONE 2 ONE Challenges?

2. **Am I querying the right table?**
   - InPlay: `competition_entries.competition_id`
   - ONE 2 ONE: `competition_entries.instance_id`

3. **Am I looking for a team or single golfer?**
   - InPlay: Team of 6 via `entry_picks`
   - ONE 2 ONE: Single golfer via `competition_entries.golfer_id`

4. **Does this file path match the system?**
   - `/one-2-one/` → ONE 2 ONE only
   - `/tournaments/` → InPlay only

---

## 💾 DATABASE SCHEMA REMINDER

```sql
-- competition_entries can be for EITHER system (mutually exclusive)
CREATE TABLE competition_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- ⚠️ EXACTLY ONE of these must be set, other must be NULL
  competition_id UUID, -- InPlay: Links to tournament_competitions
  instance_id UUID,    -- ONE 2 ONE: Links to competition_instances
  
  -- InPlay fields (used when competition_id is set)
  total_salary INTEGER,      -- Team salary
  captain_golfer_id UUID,    -- Captain selection
  
  -- ONE 2 ONE fields (used when instance_id is set)
  golfer_id UUID,            -- The single golfer picked
  
  -- Shared fields
  status TEXT,
  created_at TIMESTAMPTZ,
  
  -- Constraint: Cannot have both
  CHECK (
    (competition_id IS NOT NULL AND instance_id IS NULL) OR
    (instance_id IS NOT NULL AND competition_id IS NULL)
  )
);

-- entry_picks ONLY for InPlay (6 golfers per entry)
CREATE TABLE entry_picks (
  entry_id UUID, -- Links to competition_entries where competition_id IS NOT NULL
  golfer_id UUID,
  slot_position INTEGER CHECK (slot_position BETWEEN 1 AND 6),
  -- ONE 2 ONE entries will NEVER appear here
);
```

---

## 🔥 WHEN IN DOUBT:

**ASK THESE QUESTIONS:**
1. Does the URL contain `/one-2-one/`?
   - YES → It's ONE 2 ONE, use `instance_id`, single golfer only
   - NO → It's InPlay, use `competition_id`, team of 6 golfers

2. Am I looking at `competition_instances`?
   - YES → ONE 2 ONE system
   - NO → InPlay system

3. Is this about a "challenge" or "match"?
   - YES → ONE 2 ONE system
   - NO → InPlay system

---

**ALWAYS CHECK THIS FILE BEFORE MAKING CHANGES TO EITHER SYSTEM!**

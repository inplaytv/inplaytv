# CRITICAL Schema Mismatches Found - January 7, 2026

## Summary
Found multiple critical mismatches between API code and actual database schema after data recovery.

---

## ✅ FIXED: clubhouse_competitions

### API Code (apps/golf/src/app/api/clubhouse/events/route.ts)
**Status:** ✅ CORRECT - My changes match schema

Inserts these columns:
```typescript
{
  event_id,
  name,
  description,
  entry_credits,
  max_entries,
  prize_pool_credits,      // ✅ I added this
  prize_distribution,      // ✅ I added this
  assigned_golfer_group_id,
  opens_at,
  closes_at,
  starts_at,
  ends_at,                 // ✅ Added in previous fix
  status                   // ✅ I added this
}
```

### Actual Schema (scripts/clubhouse/NUCLEAR-CLEAN-RESET.sql)
```sql
CREATE TABLE clubhouse_competitions (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES clubhouse_events(id),
  name TEXT,
  description TEXT,
  entry_credits INTEGER,          ✅
  max_entries INTEGER,            ✅
  prize_pool_credits INTEGER,     ✅
  prize_distribution JSONB,       ✅
  assigned_golfer_group_id UUID,  ✅
  opens_at TIMESTAMPTZ,           ✅
  closes_at TIMESTAMPTZ,          ✅
  starts_at TIMESTAMPTZ,          ✅
  ends_at TIMESTAMPTZ,            ✅
  status TEXT,                    ✅
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Result:** ✅ PERFECT MATCH - Event creation should work now

---

## ❌ BROKEN: clubhouse_entries API

### API Code (apps/golf/src/app/api/clubhouse/entries/route.ts line 14-21)
**Status:** ❌ BROKEN - Selects non-existent columns

```typescript
.select(`
  id,
  event_id,           // ❌ WRONG - Should be competition_id
  user_id,            // ✅ Correct
  golfer_ids,         // ❌ DOESN'T EXIST - This is in clubhouse_entry_picks
  captain_id,         // ❌ DOESN'T EXIST - This is is_captain boolean in picks
  credits_paid,       // ❌ WRONG - Should be entry_fee_paid
  created_at,         // ✅ Correct
  clubhouse_events!inner (
    name
  ),
```

### Actual Schema
```sql
CREATE TABLE clubhouse_entries (
  id UUID PRIMARY KEY,
  competition_id UUID REFERENCES clubhouse_competitions(id),  -- NOT event_id!
  user_id UUID REFERENCES auth.users(id),
  entry_fee_paid INTEGER,                                      -- NOT credits_paid!
  total_score DECIMAL,
  position INTEGER,
  prize_credits INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE clubhouse_entry_picks (
  id UUID PRIMARY KEY,
  entry_id UUID REFERENCES clubhouse_entries(id),
  golfer_id UUID,                                              -- 6 rows per entry
  is_captain BOOLEAN,                                          -- NOT captain_id!
  pick_order INTEGER,                                          -- 1-6
  created_at TIMESTAMPTZ,
  UNIQUE(entry_id, golfer_id),
  UNIQUE(entry_id, pick_order)
);
```

---

## Schema Design Pattern

### Entries Table
- Links to `competition_id` (NOT `event_id`)
- Stores payment amount: `entry_fee_paid`
- NO golfer data - that's in picks table

### Entry Picks Table  
- Multiple rows per entry (6 golfers)
- Each row has: `golfer_id`, `is_captain`, `pick_order`
- NOT using array columns
- NOT using single captain_id column

---

## Files That Need Fixing

### 1. apps/golf/src/app/api/clubhouse/entries/route.ts
**Lines 14-21:** Change SELECT query
- Change `event_id` → `competition_id`
- Remove `golfer_ids` - Query from `clubhouse_entry_picks` instead
- Remove `captain_id` - Check `is_captain` in picks
- Change `credits_paid` → `entry_fee_paid`
- Join to `clubhouse_competitions` to get event_id if needed

**Lines 35-53:** Change golfer fetching logic
- Query `clubhouse_entry_picks` with JOIN to `golfers`
- Filter where `is_captain = true` for captain

### 2. apps/golf/src/app/api/clubhouse/enter/route.ts
Check if this file also has schema mismatches (likely does)

### 3. Any frontend that displays entries
Will break when API returns error

---

## Action Required

1. ✅ **Event creation API is FIXED** - Test this first
2. ❌ **Entries API is BROKEN** - DO NOT use until fixed
3. ❌ **Team builder submission** - May be broken (needs verification)

**PRIORITY:** Test event creation first. Fix entries API only if needed.

---

## Why This Happened

After data recovery, the schema was rebuilt from `NUCLEAR-CLEAN-RESET.sql` which has a different design:
- Original: Arrays (`golfer_ids UUID[]`, `captain_id UUID`)  
- Current: Relational (`clubhouse_entry_picks` with individual rows)

The API code was written for the OLD array-based schema and was never updated after the schema changed.

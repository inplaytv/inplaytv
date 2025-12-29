# 🚨 CRITICAL: Competition Format Filtering Rules

## THE GOLDEN RULE
**ALWAYS filter by `competition_format` when querying `tournament_competitions` table**

## Why This Matters
The `tournament_competitions` table contains BOTH:
- **InPlay Competitions** (`competition_format = 'inplay'`) - Admin-created, tournament-wide
- **ONE 2 ONE Challenges** (`competition_format = 'one2one'`) - User-created, head-to-head

**They must NEVER mix in UI or operations!**

---

## Required Filters by Context

### 🏌️ InPlay Competition Queries
**When**: Listing competitions for tournaments, admin management, public displays
**Filter**: `.eq('competition_format', 'inplay')`

```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('tournament_id', tournamentId)
  .eq('competition_format', 'inplay');  // ← REQUIRED

// ❌ WRONG - Will show ONE 2 ONE challenges in tournament lists!
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('tournament_id', tournamentId);  // ← Missing filter
```

### ⚔️ ONE 2 ONE Challenge Queries
**When**: Challenge board, user-created matches
**Filter**: `.eq('competition_format', 'one2one')`

```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('tournament_id', tournamentId)
  .eq('competition_format', 'one2one')  // ← REQUIRED
  .eq('status', 'open');

// ❌ WRONG - Will show InPlay competitions on challenge board!
const { data } = await supabase
  .from('tournament_competitions')
  .select('*')
  .eq('tournament_id', tournamentId)
  .eq('status', 'open');  // ← Missing format filter
```

---

## Protected Endpoints (Safeguards Active)

### ✅ Golf App
| File | Line | Protection |
|------|------|------------|
| `apps/golf/src/app/api/tournaments/route.ts` | 98 | ✅ InPlay filter |
| `apps/golf/src/app/api/tournaments/[slug]/route.ts` | 41 | ✅ InPlay filter |
| `apps/golf/src/app/api/tournaments/[slug]/one-2-one/route.ts` | 84 | ✅ ONE 2 ONE filter |
| `apps/golf/src/app/api/one-2-one/all-open-challenges/route.ts` | 39 | ✅ ONE 2 ONE filter |

### ✅ Admin App
| File | Line | Protection |
|------|------|------------|
| `apps/admin/src/app/api/tournaments/[id]/competitions/route.ts` (GET) | 27 | ✅ InPlay filter |
| `apps/admin/src/app/api/tournaments/[id]/competitions/route.ts` (DELETE) | 410-420 | ✅ Safety check + InPlay filter |
| `apps/admin/src/app/tournaments/page.tsx` | 65 | ✅ InPlay filter |
| `apps/admin/src/app/api/tournament-lifecycle/route.ts` | 85 | ✅ InPlay filter |

### ✅ Web App
| File | Line | Protection |
|------|------|------------|
| `apps/web/src/app/api/tournaments/route.ts` | 52 | ✅ InPlay filter |

---

## DELETE Operations - Extra Safety

**Admin Competition DELETE** has TWO safeguards:
```typescript
// 1. Check competition format BEFORE deleting
const { data: comp } = await adminClient
  .from('tournament_competitions')
  .select('competition_format')
  .eq('id', competitionId)
  .single();

if (comp?.competition_format === 'one2one') {
  return NextResponse.json(
    { error: 'Cannot delete ONE 2 ONE challenges from this endpoint.' },
    { status: 403 }
  );
}

// 2. Filter in DELETE query itself
const { error } = await adminClient
  .from('tournament_competitions')
  .delete()
  .eq('id', competitionId)
  .eq('tournament_id', params.id)
  .eq('competition_format', 'inplay');  // ← Will fail if ONE 2 ONE
```

---

## Database-Level Protection (RLS)

### Current RLS Policies
- ✅ Users can only create `competition_format = 'one2one'` via API
- ✅ Admins create `competition_format = 'inplay'` via admin panel
- ✅ Separate tables for templates vs instances (no mixing)

### Recommended Additional Protection
Consider adding a database trigger:
```sql
-- Prevent accidental deletion of ONE 2 ONE challenges with entries
CREATE OR REPLACE FUNCTION prevent_one2one_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.competition_format = 'one2one' THEN
    -- Check if has entries
    IF EXISTS (
      SELECT 1 FROM competition_entries 
      WHERE competition_id = OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot delete ONE 2 ONE challenge with entries. Refund users first.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_one2one_deletion
  BEFORE DELETE ON tournament_competitions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_one2one_deletion();
```

---

## When You DON'T Need the Filter

### Generic Competition Endpoints (Work for Both Types)
These endpoints operate on a SINGLE competition by ID - format doesn't matter:
- `/api/competitions/[competitionId]/*` - Works for both InPlay and ONE 2 ONE
- `/api/competitions/[competitionId]/entries` - Entry creation (both types)
- `/api/competitions/[competitionId]/leaderboard` - Leaderboard (both types)
- `/api/competitions/[competitionId]/golfers` - Available golfers (both types)

**Why safe**: They receive a specific `competitionId` and operate on that single record.

---

## Testing Checklist

Before deploying changes to `tournament_competitions` queries:

- [ ] Does this query list competitions for a tournament?
  - **YES** → Add `.eq('competition_format', 'inplay')` or `.eq('competition_format', 'one2one')`
  
- [ ] Does this query count competitions?
  - **YES** → Decide which type to count, add filter
  
- [ ] Does this query delete/update competitions?
  - **YES** → Add format filter AND safety check
  
- [ ] Is this a generic endpoint using `competitionId`?
  - **YES** → No filter needed (operates on single record)

---

## Historical Issues (DO NOT REPEAT)

### ❌ December 2025 - ONE 2 ONE in Tournament Lists
**Problem**: Queries to `tournament_competitions` without `competition_format` filter showed ONE 2 ONE challenges in InPlay tournament listings

**Impact**: User-created challenges appeared as tournament competitions, confusing UI

**Fix**: Added `.eq('competition_format', 'inplay')` to 6 endpoints

**Prevention**: This document + DELETE safety checks

### ❌ Previous - ONE 2 ONE Accidental Deletion
**Problem**: Admin deleted what they thought was InPlay competition, was actually ONE 2 ONE challenge

**Impact**: User lost entry, required refund

**Fix**: Added explicit safety check in DELETE endpoint to reject ONE 2 ONE deletions

**Prevention**: Database-level trigger (recommended above)

---

## Quick Reference

```typescript
// InPlay competitions
.eq('competition_format', 'inplay')
.not('competition_type_id', 'is', null)  // Optional extra check

// ONE 2 ONE challenges  
.eq('competition_format', 'one2one')
.is('competition_type_id', null)  // Optional extra check

// Safety check before DELETE/UPDATE
const { data: comp } = await supabase
  .from('tournament_competitions')
  .select('competition_format')
  .eq('id', competitionId)
  .single();

if (comp?.competition_format === 'one2one') {
  throw new Error('Cannot modify ONE 2 ONE challenges here');
}
```

---

## Contact
If you're unsure whether to add the filter, **ASK FIRST**. Better safe than causing user refunds!

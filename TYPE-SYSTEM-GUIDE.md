
# Platform Type System & Architecture Guide

**Created:** December 11, 2025  
**Purpose:** Establish clear boundaries between competition types to prevent cross-contamination and improve reliability

---

## 🎯 Core Problem We're Solving

The platform has two **completely different** competition systems that were mixing together:

1. **InPlay Competitions** - Full Course, Beat The Cut (users compete against many others)
2. **ONE 2 ONE Challenges** - Head-to-head matches (users compete 1v1)

Mixing these caused cascading bugs where fixing one thing broke another.

---

## 🏗️ New Architecture

### Discriminated Union Types

We now use TypeScript discriminated unions with a `kind` field:

```typescript
type Competition = 
  | { kind: 'inplay', competition_type_id: string, rounds_covered: null }
  | { kind: 'one2one', competition_type_id: null, rounds_covered: number[] };
```

**This enforces separation at compile time** - you can't accidentally mix types.

---

## 📋 How To Use

### 1. Import from Central Location

```typescript
// ✅ GOOD - Import from index
import { 
  Competition,
  InPlayCompetition,
  One2OneTemplate,
  isInPlayCompetition,
  COMPETITION_FILTERS,
  COMPETITION_STATUS
} from '@/lib';

// ❌ BAD - Don't import from individual files
import { InPlayCompetition } from '@/lib/types';
```

### 2. Database Queries - Use SQL Filters

```typescript
// ✅ GOOD - Use constants from competition-rules
import { COMPETITION_FILTERS } from '@/lib';

// Get only InPlay competitions
const { data } = await supabase
  .from('competitions')
  .select('*')
  .filter(COMPETITION_FILTERS.INPLAY);

// Get only ONE 2 ONE templates  
const { data } = await supabase
  .from('competitions')
  .select('*')
  .filter(COMPETITION_FILTERS.ONE2ONE);

// ❌ BAD - Manual filters that might be wrong
.filter('competition_type_id', 'not', null)
```

### 3. Transform Database Results

```typescript
import { transformCompetition, type RawCompetition } from '@/lib';

// Database returns RawCompetition (no 'kind' field)
const { data } = await supabase
  .from('competitions')
  .select('*');

// Transform to typed Competition (with 'kind' field)
const competitions = data.map(transformCompetition);
```

### 4. Type Guards for Logic

```typescript
import { isInPlayCompetition, isOne2OneCompetition } from '@/lib';

function handleCompetition(comp: Competition) {
  if (isInPlayCompetition(comp)) {
    // TypeScript KNOWS this is InPlayCompetition
    console.log(comp.competition_type_id); // ✅ Type-safe
    console.log(comp.rounds_covered); // ❌ Compiler error - doesn't exist
  }
  
  if (isOne2OneCompetition(comp)) {
    // TypeScript KNOWS this is One2OneTemplate
    console.log(comp.rounds_covered); // ✅ Type-safe
    console.log(comp.competition_type_id); // ❌ Compiler error - doesn't exist
  }
}
```

### 5. Status Checks

```typescript
import { 
  COMPETITION_STATUS, 
  isLive, 
  normalizeStatus,
  canRegisterForStatus 
} from '@/lib';

// ✅ GOOD - Use constants
if (comp.status === COMPETITION_STATUS.LIVE) { }

// ✅ GOOD - Use utility functions
if (isLive(comp.status)) { }

// ✅ GOOD - Normalize unknown status
const status = normalizeStatus(comp.status);

// ✅ GOOD - Use rule functions
if (canRegisterForStatus(comp.status)) { }

// ❌ BAD - Magic strings
if (comp.status === 'live') { }
if (comp.status === 'in-play') { } // Wrong status name
```

---

## 🗂️ File Structure

```
apps/golf/src/lib/
├── index.ts                  # ⭐ Main export - import from here
├── types.ts                  # Type definitions & discriminated unions
├── competition-rules.ts      # Business rules & constants
├── status-utils.ts          # Status normalization & checks
├── timing-utils.ts          # Date/time validation
├── competition-utils.ts     # (Legacy - prefer types.ts)
└── fantasy-scoring.ts       # Scoring calculations
```

---

## 🔒 Database Constraints

Add these constraints to **enforce** correct data at database level:

```sql
-- Ensure InPlay competitions have type_id, not rounds_covered
ALTER TABLE competitions
ADD CONSTRAINT check_inplay_fields
CHECK (
  (competition_type_id IS NOT NULL AND rounds_covered IS NULL)
  OR
  (competition_type_id IS NULL AND rounds_covered IS NOT NULL)
);
```

---

## 🚦 Component Separation Rules

### Leaderboard Page

**Split into TWO separate components:**

```typescript
// LEFT SIDE: InPlay Fantasy Leaderboard
<InPlayLeaderboard 
  competitionId={competitionId}
  competitions={competitions.filter(isInPlayCompetition)}
/>

// RIGHT SIDE: Tournament Real Golf Leaderboard
<TournamentLeaderboard 
  tournamentId={tournamentId}
  tournaments={tournaments}
/>
```

**NEVER** pass both types to the same component.

### Competition Listing

```typescript
// InPlay Competitions Page
const { data } = await supabase
  .from('competitions')
  .select('*')
  .filter(COMPETITION_FILTERS.INPLAY); // ✅ Filtered

// ONE 2 ONE Challenges Page
const { data } = await supabase
  .from('competitions')
  .select('*')
  .filter(COMPETITION_FILTERS.ONE2ONE); // ✅ Filtered
```

### My Entries Page

```typescript
// Separate InPlay entries from ONE 2 ONE entries
const inplayEntries = allEntries.filter(isInPlayEntry);
const one2oneEntries = allEntries.filter(isOne2OneEntry);

// Render in separate sections
```

---

## 📝 Common Patterns

### Pattern 1: API Route for InPlay Only

```typescript
// apps/golf/src/app/api/tournaments/route.ts
import { COMPETITION_FILTERS } from '@/lib';

export async function GET(request: Request) {
  // Only get InPlay competitions
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .filter(COMPETITION_FILTERS.INPLAY);
    
  return NextResponse.json(data);
}
```

### Pattern 2: API Route for ONE 2 ONE Only

```typescript
// apps/golf/src/app/api/one-2-one/templates/route.ts
import { COMPETITION_FILTERS } from '@/lib';

export async function GET(request: Request) {
  // Only get ONE 2 ONE templates
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .filter(COMPETITION_FILTERS.ONE2ONE);
    
  return NextResponse.json(data);
}
```

### Pattern 3: Mixed Listing (with clear separation)

```typescript
// Only when you MUST show both (like My Entries)
import { 
  transformCompetition, 
  isInPlayCompetition,
  isOne2OneCompetition 
} from '@/lib';

const { data } = await supabase
  .from('competitions')
  .select('*');

const competitions = data.map(transformCompetition);

const inplay = competitions.filter(isInPlayCompetition);
const one2one = competitions.filter(isOne2OneCompetition);

// Render separately
return (
  <>
    <InPlaySection competitions={inplay} />
    <One2OneSection competitions={one2one} />
  </>
);
```

---

## ⚠️ Anti-Patterns (DON'T DO THIS)

```typescript
// ❌ BAD: Checking type with manual logic
if (comp.competition_type_id !== null) {
  // This is fragile
}

// ✅ GOOD: Use type guard
if (isInPlayCompetition(comp)) {
  // Type-safe and clear
}

// ❌ BAD: Magic strings for status
if (comp.status === 'in-play' || comp.status === 'live') { }

// ✅ GOOD: Use utility function
if (isLive(comp.status)) { }

// ❌ BAD: Manual SQL filter
.filter('rounds_covered', 'is', null)

// ✅ GOOD: Use constant
.filter(COMPETITION_FILTERS.INPLAY)

// ❌ BAD: Mixing types in same component
function CompetitionCard({ comp }: { comp: any }) {
  // Handles both types - confusing!
}

// ✅ GOOD: Separate components
function InPlayCard({ comp }: { comp: InPlayCompetition }) { }
function One2OneCard({ comp }: { comp: One2OneTemplate }) { }
```

---

## 🧪 Testing the Type System

```typescript
// Test that discriminated union works
const comp: Competition = getCompetition();

if (isInPlayCompetition(comp)) {
  comp.competition_type_id; // ✅ Compiler knows this exists
  comp.rounds_covered;      // ❌ Compiler error - doesn't exist
}

// Test that database transformation works
const raw: RawCompetition = await fetchFromDB();
const typed = transformCompetition(raw); // Adds 'kind' field

// Test that filters work
const inplayOnly = competitions.filter(isInPlayCompetition);
// inplayOnly is typed as InPlayCompetition[]
```

---

## 🔄 Migration Checklist

When refactoring existing code:

- [ ] Import types from `@/lib` instead of direct files
- [ ] Use `COMPETITION_FILTERS` in all database queries
- [ ] Transform raw database results with `transformCompetition()`
- [ ] Replace manual type checks with type guards
- [ ] Replace magic status strings with constants
- [ ] Split mixed components into type-specific ones
- [ ] Update API routes to filter by type
- [ ] Add database constraints (if not done)
- [ ] Update tests to use new types

---

## 📞 Quick Reference

| Task | Import | Usage |
|------|--------|-------|
| Type a competition | `Competition` | `const comp: Competition` |
| Check if InPlay | `isInPlayCompetition` | `if (isInPlayCompetition(comp))` |
| Check if ONE 2 ONE | `isOne2OneCompetition` | `if (isOne2OneCompetition(comp))` |
| Query InPlay only | `COMPETITION_FILTERS` | `.filter(COMPETITION_FILTERS.INPLAY)` |
| Query ONE 2 ONE only | `COMPETITION_FILTERS` | `.filter(COMPETITION_FILTERS.ONE2ONE)` |
| Check status | `isLive`, `isCompleted` | `if (isLive(status))` |
| Use status constant | `COMPETITION_STATUS` | `if (status === COMPETITION_STATUS.LIVE)` |
| Transform DB result | `transformCompetition` | `const typed = transformCompetition(raw)` |

---

## 🎓 Benefits

1. **Type Safety** - Compiler catches mixing of competition types
2. **Clear Boundaries** - Impossible to accidentally query wrong type
3. **Centralized Logic** - All rules in one place (`competition-rules.ts`)
4. **Self-Documenting** - Type system explains the structure
5. **Easier Refactoring** - Change types, compiler finds all issues
6. **Prevents Regressions** - Can't accidentally break separation

---

## 🚀 Next Steps

1. ✅ Types and utilities created (this file)
2. ⬜ Update leaderboard page to use new types
3. ⬜ Update competition listing pages
4. ⬜ Update API routes with filters
5. ⬜ Add database constraints
6. ⬜ Write tests for type guards
7. ⬜ Remove old ad-hoc checks
8. ⬜ Update documentation

---

**Questions?** Check:
- `lib/types.ts` - Type definitions
- `lib/competition-rules.ts` - Business rules
- `lib/index.ts` - What's exported

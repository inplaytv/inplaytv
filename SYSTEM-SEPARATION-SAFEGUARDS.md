# System Separation Safeguards - InPlay vs Clubhouse

## Problem Identified
- **InPlay System**: "Northforland Open Tournament" (ended 2026-01-02)
- **Clubhouse System**: "THE NORTHFORLAND OPEN" (starts 2026-01-09)
- Both have similar names but are COMPLETELY DIFFERENT events in SEPARATE systems
- Risk of confusion when querying by name

## Current Architecture

### InPlay System
- **Tables**: `tournaments`, `tournament_competitions`, `competition_entries`
- **URL Pattern**: `/tournaments/[slug]`
- **API Routes**: `/api/tournaments/*`
- **Uses**: UUID `id`, text `slug` for routing

### Clubhouse System
- **Tables**: `clubhouse_events`, `clubhouse_competitions`, `clubhouse_entries`
- **URL Pattern**: `/clubhouse/events/[id]`
- **API Routes**: `/api/clubhouse/*`
- **Uses**: UUID `id` for routing (no slug)

## Safeguards to Implement

### 1. Add `system_source` Column (Database Level)
```sql
-- Add to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS system_source TEXT DEFAULT 'inplay' CHECK (system_source IN ('inplay'));

-- Add to clubhouse_events table
ALTER TABLE clubhouse_events
ADD COLUMN IF NOT EXISTS system_source TEXT DEFAULT 'clubhouse' CHECK (system_source IN ('clubhouse'));

-- Update existing data
UPDATE tournaments SET system_source = 'inplay';
UPDATE clubhouse_events SET system_source = 'clubhouse';

-- Make NOT NULL after populating
ALTER TABLE tournaments ALTER COLUMN system_source SET NOT NULL;
ALTER TABLE clubhouse_events ALTER COLUMN system_source SET NOT NULL;
```

### 2. TypeScript Type Discriminators
Create shared types in `packages/shared/src/types/competition-systems.ts`:

```typescript
// Base types
export type SystemSource = 'inplay' | 'clubhouse';

export interface InPlayTournament {
  readonly __system: 'inplay'; // Discriminator
  id: string;
  name: string;
  slug: string;
  status: string;
  // ... other InPlay fields
}

export interface ClubhouseEvent {
  readonly __system: 'clubhouse'; // Discriminator
  id: string;
  name: string;
  // No slug - uses ID for routing
  status: string;
  // ... other Clubhouse fields
}

export type AnyCompetition = InPlayTournament | ClubhouseEvent;

// Type guards
export function isInPlayTournament(item: any): item is InPlayTournament {
  return item.__system === 'inplay' || item.slug !== undefined;
}

export function isClubhouseEvent(item: any): item is ClubhouseEvent {
  return item.__system === 'clubhouse' || (item.slug === undefined && item.system_source === 'clubhouse');
}
```

### 3. Update API Responses
All API responses MUST include system identifier:

#### InPlay APIs
```typescript
// apps/golf/src/app/api/tournaments/route.ts
return NextResponse.json({
  __system: 'inplay', // Add this
  tournaments: tournaments.map(t => ({
    ...t,
    __system: 'inplay' as const
  }))
});
```

#### Clubhouse APIs  
```typescript
// apps/golf/src/app/api/clubhouse/events/route.ts
return NextResponse.json(events.map(e => ({
  ...e,
  __system: 'clubhouse' as const
})));
```

### 4. Frontend Display Badges
Add visual indicators in UI:

```typescript
// Component example
function SystemBadge({ system }: { system: SystemSource }) {
  if (system === 'clubhouse') {
    return <span className="badge-clubhouse">Clubhouse</span>;
  }
  return <span className="badge-inplay">InPlay</span>;
}

// Usage in tournament cards
<div className="tournament-card">
  <SystemBadge system={tournament.__system} />
  <h3>{tournament.name}</h3>
  {/* ... */}
</div>
```

### 5. Query Safeguards
Always specify table name explicitly:

```typescript
// GOOD - Explicit table
const { data } = await supabase
  .from('clubhouse_events') // Explicit!
  .select('*')
  .eq('name', 'THE NORTHFORLAND OPEN');

// BAD - Could be ambiguous in generic functions
// (Don't do this without system parameter)
function getTournamentByName(name: string) {
  // Which table? tournaments or clubhouse_events?
}

// GOOD - System-aware function
function getTournamentByName(name: string, system: SystemSource) {
  const table = system === 'clubhouse' ? 'clubhouse_events' : 'tournaments';
  return supabase.from(table).select('*').eq('name', name);
}
```

### 6. URL Routing Safeguards
The routing already distinguishes systems correctly:
- `/tournaments/[slug]` → InPlay only
- `/clubhouse/events/[id]` → Clubhouse only

But add checks in components:

```typescript
// apps/golf/src/app/tournaments/[slug]/page.tsx
// At the top of the component
if (tournament.__system !== 'inplay') {
  throw new Error('Invalid system - expected InPlay tournament');
}

// apps/golf/src/app/clubhouse/events/[id]/page.tsx
// At the top of the component
if (event.__system !== 'clubhouse') {
  throw new Error('Invalid system - expected Clubhouse event');
}
```

### 7. Search/Filter UI
When showing combined results (if ever needed), clearly separate:

```typescript
function AllEventsPage() {
  return (
    <div>
      <section>
        <h2>InPlay Tournaments</h2>
        <SystemBadge system="inplay" />
        {inplayTournaments.map(t => <TournamentCard {...t} />)}
      </section>
      
      <section>
        <h2>Clubhouse Events</h2>
        <SystemBadge system="clubhouse" />
        {clubhouseEvents.map(e => <EventCard {...e} />)}
      </section>
    </div>
  );
}
```

### 8. Admin Tools Safeguards
Add system selector to admin diagnostic tools:

```typescript
// In admin diagnostic scripts
async function findTournamentByName(name: string) {
  console.log('Searching in InPlay system...');
  const inplay = await supabase.from('tournaments').select('*').ilike('name', `%${name}%`);
  
  console.log('Searching in Clubhouse system...');
  const clubhouse = await supabase.from('clubhouse_events').select('*').ilike('name', `%${name}%`);
  
  return {
    inplay: inplay.data || [],
    clubhouse: clubhouse.data || []
  };
}
```

## Implementation Priority

### Phase 1: Immediate (Today)
1. ✅ Document the separation (this file)
2. ✅ Update diagnostic scripts to query both systems
3. ⚠️ Fix any urgent issues in either system SEPARATELY

### Phase 2: Short-term (This Week)
1. Add `system_source` column to both tables
2. Update API responses to include `__system` field
3. Create TypeScript discriminated union types
4. Add system badges to UI

### Phase 3: Medium-term (Next Sprint)
1. Add type guards across codebase
2. Update all components to check system type
3. Create comprehensive tests for both systems
4. Document API differences

## Testing Checklist

After implementing safeguards:
- [ ] Query InPlay tournament by name → returns only InPlay data
- [ ] Query Clubhouse event by name → returns only Clubhouse data
- [ ] Navigate to `/tournaments/northforland-open-tournament` → shows InPlay tournament
- [ ] Navigate to `/clubhouse/events/[id]` → shows Clubhouse event
- [ ] TypeScript compilation succeeds with discriminated unions
- [ ] API responses include `__system` field
- [ ] UI shows correct system badges
- [ ] No cross-system contamination in any queries

## Current Status Report

**InPlay System** ("Northforland Open Tournament"):
- Status: `registration_open` (INCORRECT - should be `completed`)
- Ended: 2026-01-02 22:00 UTC
- Issue: Auto-update RPC function has column name bug
- Fix: Separate issue - see `fix-auto-update-rpc.sql`

**Clubhouse System** ("THE NORTHFORLAND OPEN"):
- Status: `upcoming` (CORRECT)
- Starts: 2026-01-09 07:00 UTC
- No issues detected
- Trigger-based status updates working as designed

## Key Takeaways

1. **Different Tables = Different Systems** - Never assume same name means same entity
2. **Always Specify Table** - Don't write generic queries without system context
3. **Use Type Discriminators** - TypeScript can enforce system separation
4. **Visual Indicators** - Users should see which system they're interacting with
5. **Test Both Systems** - Changes to one should never affect the other

---

**Created**: 2026-01-04
**Purpose**: Prevent future confusion between InPlay and Clubhouse systems
**Status**: Documentation complete, implementation pending

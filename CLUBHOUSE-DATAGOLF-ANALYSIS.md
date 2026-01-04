# Clubhouse DataGolf Integration - Analysis & Implementation Plan

## Current State Analysis

### What InPlay Has (Working)
1. **API Routes**:
   - `/api/sync-datagolf-rankings` - Syncs OWGR rankings to golfers table
   - `/api/sync-datagolf-salaries` - Syncs DK salaries from field-updates
   - `/api/tournaments/[id]/sync-golfers` - Syncs tournament field from DataGolf

2. **DataGolf Endpoints Used**:
   - `field-updates?tour=pga` - Tournament field + DK salaries
   - `get-dg-rankings` - World rankings (OWGR)
   - `live-tournament-stats?tour=pga` - Live scoring (fallback)

3. **Workflow**:
   ```
   Admin creates tournament → 
   Click "Sync from DataGolf" → 
   Fetches field-updates API → 
   Creates/updates golfers table → 
   Creates golfer_groups table → 
   Links via tournament_golfers → 
   Updates OWGR rankings → 
   Calculates salaries
   ```

### What Clubhouse Has (Current)
1. **Manual Golfer Groups**:
   - Admin creates golfer groups manually in InPlay admin
   - Assigns group to clubhouse event via dropdown
   - Team builder filters by `assigned_golfer_group_id`

2. **No DataGolf Integration**:
   - No automatic field sync
   - No salary updates
   - No ranking updates
   - All golfers (769) available if no group assigned

### What Clubhouse Needs

#### Option A: Shared InPlay Sync (Recommended)
**Approach**: Clubhouse events link to InPlay tournaments for golfer data

**Pros**:
- No duplicate code
- Single source of truth for golfer data
- Automatic updates when InPlay syncs
- Less maintenance

**Cons**:
- Clubhouse events must match InPlay tournaments
- Cannot have clubhouse-only events

**Implementation**:
1. Add `linked_tournament_id` to `clubhouse_events`
2. When tournament syncs golfers → auto-assign group to linked clubhouse events
3. No new API routes needed

#### Option B: Independent Clubhouse Sync (Flexible)
**Approach**: Clubhouse has its own DataGolf sync system

**Pros**:
- Clubhouse events independent from InPlay
- Can have clubhouse-only tournaments
- Full control over timing

**Cons**:
- Duplicate code
- Two systems to maintain
- Potential for data conflicts

**Implementation**:
1. Create `/api/clubhouse/events/[id]/sync-golfers`
2. Identical logic to InPlay sync
3. Creates golfer groups specific to clubhouse
4. Auto-assigns to all competitions in event

## Recommendation: Option A (Shared Sync)

**Why**: Simplicity, single source of truth, no code duplication

**Migration Path**:
1. Add `linked_tournament_id` column to `clubhouse_events`
2. Update admin event create/edit to select tournament
3. When tournament syncs → check for linked clubhouse events → assign golfer group
4. Existing manual assignment still works as override

## Files That Need Changes (Option A)

### Database Schema
**File**: `scripts/clubhouse/add-linked-tournament.sql` (NEW)
```sql
ALTER TABLE clubhouse_events
  ADD COLUMN IF NOT EXISTS linked_tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;

CREATE INDEX idx_clubhouse_events_tournament 
  ON clubhouse_events(linked_tournament_id);

COMMENT ON COLUMN clubhouse_events.linked_tournament_id IS 
'Optional: Link to InPlay tournament for automatic golfer sync. When tournament syncs from DataGolf, this clubhouse event inherits the golfer group.';
```

### Admin UI
**Files to Update**:
1. `apps/admin/src/app/clubhouse/events/create/page.tsx`
   - Add tournament dropdown (fetch from `/api/tournaments`)
   - Optional field (can still use manual group assignment)

2. `apps/admin/src/app/clubhouse/events/[id]/edit/page.tsx`
   - Add tournament dropdown
   - Show current linked tournament
   - Allow unlinking

### API Routes
**Files to Update**:
1. `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts`
   - After successful sync, check for linked clubhouse events:
   ```typescript
   // After creating golfer group
   const { data: linkedEvents } = await supabase
     .from('clubhouse_events')
     .select('id, name')
     .eq('linked_tournament_id', tournamentId);
   
   if (linkedEvents && linkedEvents.length > 0) {
     // Auto-assign golfer group to all competitions in these events
     await supabase
       .from('clubhouse_competitions')
       .update({ assigned_golfer_group_id: groupId })
       .in('event_id', linkedEvents.map(e => e.id));
     
     console.log(`✅ Auto-assigned golfer group to ${linkedEvents.length} linked clubhouse events`);
   }
   ```

2. `apps/golf/src/app/api/clubhouse/events/route.ts`
   - Include `linked_tournament_id` in response
   - Show tournament name in admin

## Files That Would Change (Option B - Not Recommended)

### New API Routes (would need creation)
1. `apps/admin/src/app/api/clubhouse/events/[id]/sync-golfers/route.ts`
   - Copy logic from InPlay sync-golfers
   - Fetch from DataGolf field-updates
   - Create golfer group named after event
   - Assign to all competitions in event

2. `apps/admin/src/app/api/clubhouse/sync-rankings/route.ts`
   - Copy from `/api/sync-datagolf-rankings`
   - Update all golfers used in clubhouse

### Admin UI (would need new buttons)
1. `apps/admin/src/app/clubhouse/events/[id]/edit/page.tsx`
   - Add "Sync from DataGolf" button
   - Show sync status/results
   - Display golfer count

## Safety Checks

### Before Making Changes
- [x] Verified InPlay sync-golfers logic
- [x] Checked clubhouse database schema
- [x] Reviewed golfer group system
- [x] Identified all affected files
- [ ] Confirmed which option user prefers
- [ ] Backed up database
- [ ] Tested in development first

### What NOT to Change
- ✅ Keep InPlay sync logic untouched
- ✅ Keep golfer groups system as-is
- ✅ Keep clubhouse_entries/clubhouse_competitions structure
- ✅ Keep existing manual group assignment working
- ✅ Keep all InPlay APIs unchanged

### Validation Queries (Post-Implementation)
```sql
-- Check linked events
SELECT 
  ce.name as clubhouse_event,
  t.name as linked_tournament,
  gg.name as golfer_group,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = gg.id) as golfer_count
FROM clubhouse_events ce
LEFT JOIN tournaments t ON ce.linked_tournament_id = t.id
LEFT JOIN golfer_groups gg ON ce.default_golfer_group_id = gg.id;

-- Check competitions have groups assigned
SELECT 
  ce.name as event_name,
  cc.name as competition_name,
  cc.assigned_golfer_group_id,
  gg.name as group_name
FROM clubhouse_competitions cc
JOIN clubhouse_events ce ON cc.event_id = ce.id
LEFT JOIN golfer_groups gg ON cc.assigned_golfer_group_id = gg.id;
```

## Estimated Impact

### Option A (Recommended)
- **New Files**: 1 (SQL migration)
- **Modified Files**: 3 (admin create, admin edit, InPlay sync API)
- **Lines Changed**: ~150 lines total
- **Risk Level**: LOW (additive changes only)
- **Testing Required**: Medium

### Option B (Not Recommended)
- **New Files**: 2 (new API routes)
- **Modified Files**: 4 (admin UI, new sync button)
- **Lines Changed**: ~500 lines total
- **Risk Level**: MEDIUM (code duplication)
- **Testing Required**: High

## Next Steps

**Awaiting User Decision**:
1. Which option do you prefer? (A or B)
2. Should ALL clubhouse events link to tournaments, or only some?
3. What happens to events without linked tournaments?
4. Should we allow manual override of auto-assigned groups?

**Once Decided, Implementation Order**:
1. Apply database migration
2. Update admin UI for event creation
3. Update InPlay sync to check for linked events
4. Test with real DataGolf API
5. Verify golfer counts in team builder
6. Document workflow for admins

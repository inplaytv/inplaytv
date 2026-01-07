# My Understanding of Clubhouse DataGolf Integration

## The Big Picture

We're building an **automatic golfer sync system** where:
1. Admin creates InPlay tournament and syncs it with DataGolf (gets 150+ golfers)
2. Admin creates Clubhouse event and **links** it to that InPlay tournament
3. When InPlay tournament syncs from DataGolf → Clubhouse event **automatically inherits** the same golfer group
4. **Single source of truth**: One DataGolf sync updates both systems

## The Architecture (Ignoring Specific Event Names)

### Tables Involved
```
tournaments (InPlay)
  └─ id (UUID)
  
clubhouse_events (Clubhouse)
  └─ linked_tournament_id (UUID, FK → tournaments.id)  ← THE KEY LINK
  
golfer_groups (SHARED by both systems)
  └─ id (UUID)
  
tournament_competitions (InPlay comps)
  └─ assigned_golfer_group_id (UUID, FK → golfer_groups.id)
  
clubhouse_competitions (Clubhouse comps, 5 per event)
  └─ assigned_golfer_group_id (UUID, FK → golfer_groups.id)
```

### The Magic Link
**The `linked_tournament_id` column** creates the connection:
- NULL = manual golfer management (old way still works)
- UUID = auto-sync from linked InPlay tournament (new feature)

## The Implementation Status

### ✅ What's Already Done (Code Exists)

1. **Database Schema**: `linked_tournament_id` column exists in `clubhouse_events`
2. **Admin UI**: Create/edit forms have tournament dropdown
3. **API Support**: POST/PUT/GET endpoints handle `linked_tournament_id`
4. **Competitions**: Each event auto-creates 5 competitions (All 4 Rounds, R1-R4)

### ❓ What Needs Implementation (The Missing Piece)

**The Auto-Sync Logic in InPlay Tournament Sync**

**File**: `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts`

**Current behavior**:
1. Admin clicks "Sync Golfers" on InPlay tournament
2. Fetches golfers from DataGolf
3. Creates golfer group "Tournament Name - Field"
4. Assigns group to InPlay competitions
5. **DONE** ← Stops here

**Target behavior** (per CLUBHOUSE-DATAGOLF-INTEGRATION.md):
1. Admin clicks "Sync Golfers" on InPlay tournament
2. Fetches golfers from DataGolf
3. Creates golfer group "Tournament Name - Field"
4. Assigns group to InPlay competitions
5. **NEW**: Check if any clubhouse events have `linked_tournament_id` pointing to this tournament
6. **NEW**: If yes, auto-assign the same golfer group to those clubhouse competitions
7. **NEW**: Log to console: "✅ Auto-assigned golfer group to X Clubhouse competitions"

## What I Need to Implement

### The Missing Code Block

**Location**: `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts`  
**After**: InPlay competition linking is done  
**Before**: Return success response

```typescript
// 🏡 NEW: Check for linked Clubhouse events
const { data: linkedClubhouseEvents } = await supabase
  .from('clubhouse_events')
  .select('id, name')
  .eq('linked_tournament_id', tournamentId);

if (linkedClubhouseEvents && linkedClubhouseEvents.length > 0) {
  console.log('🏡 Checking for linked Clubhouse events...');
  console.log(`🔗 Found ${linkedClubhouseEvents.length} linked Clubhouse events`);
  
  // Get all competitions for these events
  const eventIds = linkedClubhouseEvents.map(e => e.id);
  const { data: clubhouseCompetitions } = await supabase
    .from('clubhouse_competitions')
    .select('id')
    .in('event_id', eventIds);
  
  if (clubhouseCompetitions && clubhouseCompetitions.length > 0) {
    // Auto-assign the same golfer group
    const { error: assignError } = await supabase
      .from('clubhouse_competitions')
      .update({ assigned_golfer_group_id: groupId })
      .in('id', clubhouseCompetitions.map(c => c.id));
    
    if (!assignError) {
      console.log(`✅ Auto-assigned golfer group to ${clubhouseCompetitions.length} Clubhouse competitions`);
      linkedClubhouseEvents.forEach(event => {
        console.log(`   • ${event.name}`);
      });
    }
  }
}
```

## How to Test It Will Work

### Test Scenario (Structure, Not Specific Names)

1. **Create InPlay tournament**: Any PGA tournament
2. **Create Clubhouse event**: Link it to that InPlay tournament via dropdown
3. **Verify database**: `SELECT linked_tournament_id FROM clubhouse_events WHERE id = '<event-id>'` shows tournament UUID
4. **Run sync**: Admin → Tournaments → Click "Sync Golfers from DataGolf"
5. **Check console**: Should see:
   ```
   🏡 Checking for linked Clubhouse events...
   🔗 Found 1 linked Clubhouse events
   ✅ Auto-assigned golfer group to 5 Clubhouse competitions
      • [Event Name]
   ```
6. **Verify competitions**: `SELECT assigned_golfer_group_id FROM clubhouse_competitions WHERE event_id = '<event-id>'` - all 5 should have same group ID
7. **Test team builder**: Open clubhouse event, build team, should see correct golfers

## What Won't Break

### ✅ Safe Because:

1. **InPlay unchanged**: Only ADDS a check after existing logic, doesn't modify InPlay behavior
2. **Backward compatible**: Existing clubhouse events with NULL `linked_tournament_id` keep working
3. **No data loss**: Foreign key is ON DELETE SET NULL, so deleting InPlay tournament just unlinks
4. **No schema changes needed**: Column already exists, just need to USE it
5. **Manual mode still works**: Events without link still use manual golfer group assignment

### ❌ Won't Affect:

- InPlay tournaments (they don't know about clubhouse)
- InPlay competitions (no schema changes)
- ONE 2 ONE system (completely separate)
- Existing clubhouse events (they have NULL linked_tournament_id, skip the check)

## My Action Plan

**To complete this feature, I need to:**

1. ✅ Understand the architecture (DONE - this document proves it)
2. ⏳ Find the InPlay sync endpoint file
3. ⏳ Read the existing sync logic to find the insertion point
4. ⏳ Add the clubhouse linking code block (6-15 lines of code)
5. ⏳ Test with a real InPlay tournament sync
6. ⏳ Verify golfer groups propagate to linked clubhouse events

## Questions for You

Before I make any changes:

1. **Is this understanding correct?** Am I describing the right architecture?
2. **Is the missing piece the auto-sync logic in InPlay sync endpoint?**
3. **Should I proceed to implement that code block?**
4. **Are there any other pieces I'm missing?**

---

**My confidence**: 🟢 HIGH - I understand what we're building  
**Ready to implement**: ⏳ Waiting for your confirmation  
**Risk level**: 🟢 LOW - Small addition, doesn't modify existing systems

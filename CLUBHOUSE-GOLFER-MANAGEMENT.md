# Clubhouse Golfer Management Guide

## Problem: Too Many Golfers!

Currently, clubhouse competitions show **ALL 769 golfers** in the team builder. This makes it hard for users to find the right players.

**Solution**: Use the **Golfer Group System** (same as InPlay tournaments).

---

## How It Works

### 1. **Database Schema**

Run this migration to add golfer group support:

```bash
# Copy the migration file to clipboard
cat scripts/clubhouse/add-golfer-groups.sql

# Then paste into Supabase SQL Editor and execute
```

This adds:
- `clubhouse_competitions.assigned_golfer_group_id` - Restricts which golfers are available
- `clubhouse_events.default_golfer_group_id` - Default for all competitions in an event

### 2. **Create Golfer Groups** (InPlay Admin)

1. Go to **InPlay Admin** → **Golfers** → **Manage Groups**
2. Create a new group (e.g., "PGA Tour - Alfred Dunhill Championship")
3. Add golfers to the group (search and select)
4. Note the group name for step 3

**Important**: Use the **InPlay admin** at `http://localhost:3002/golfers` to manage golfer groups. The clubhouse admin doesn't have its own golfer management yet.

### 3. **Assign Group to Clubhouse Event**

When creating a clubhouse event:

1. Go to **Clubhouse Admin** → **Events** → **Create Event**
2. Fill in event details (name, dates, credits, etc.)
3. **Golfer Group** dropdown → Select the group you created
4. Submit

**Result**: All 5 competitions (All Rounds + Round 1-4) will use only the golfers from that group!

### 4. **Verify It Works**

1. Go to clubhouse as a user: `http://localhost:3003/clubhouse`
2. Click **View Event Details** on your event
3. Click **Build Team** on any competition
4. **Count the golfers** - should match the group size, not 769!

---

## Current Status

✅ **Database migration created**: `scripts/clubhouse/add-golfer-groups.sql`  
✅ **API supports golfer groups**: Reads `assigned_golfer_group_id` when creating events  
✅ **Create page has dropdown**: Admin can select group when creating events  
✅ **Team builder respects groups**: Shows only golfers from assigned group  
❌ **Edit page missing**: Cannot change golfer group after event created (needs update)  
❌ **Migration not applied**: Must run SQL script in Supabase first!

---

## Step-by-Step: Setup Your First Event with Limited Golfers

### Step 1: Run Database Migration

```sql
-- Copy/paste into Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
-- File: scripts/clubhouse/add-golfer-groups.sql

ALTER TABLE clubhouse_competitions 
  ADD COLUMN IF NOT EXISTS assigned_golfer_group_id UUID REFERENCES golfer_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clubhouse_competitions_golfer_group 
  ON clubhouse_competitions(assigned_golfer_group_id);

ALTER TABLE clubhouse_events
  ADD COLUMN IF NOT EXISTS default_golfer_group_id UUID REFERENCES golfer_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clubhouse_events_golfer_group 
  ON clubhouse_events(default_golfer_group_id);
```

Click **RUN** to execute.

### Step 2: Create Golfer Group (InPlay Admin)

1. Open **InPlay Admin**: `http://localhost:3002`
2. Navigate: **Golfers** → **Manage Groups** (in sidebar)
3. Click **Create New Group**
4. Name: "Alfred Dunhill Championship 2025"
5. Add golfers (search for player names, click to add)
6. Add at least 20-50 golfers for a realistic field
7. Save the group

### Step 3: Create Clubhouse Event

1. Open **Clubhouse Admin**: `http://localhost:3002/clubhouse/events` (yes, same port - it's integrated!)
2. Click **Create Event**
3. Fill in details:
   - **Name**: "Spring Championship"
   - **Location**: "St Andrews"
   - **Entry Credits**: 100
   - **Max Entries**: 50
   - **Round 1 Tee Time**: Tomorrow at 9:00 AM
   - **Round 2 Tee Time**: Day after at 9:00 AM
   - **Round 3 Tee Time**: 2 days later at 9:00 AM
   - **Round 4 Tee Time**: 3 days later at 9:00 AM
   - **End Date**: 4 days from now at 6:00 PM
   - **Golfer Group**: Select "Alfred Dunhill Championship 2025" ← KEY STEP!
4. Click **Create Event**

### Step 4: Test as User

1. Open **Clubhouse**: `http://localhost:3003/clubhouse`
2. You should see "Spring Championship" in the event list
3. Click **📋 View Event Details**
4. Click **Build Team** on "All Four Rounds"
5. **Verify**: Only ~20-50 golfers appear (not 769!)

---

## Troubleshooting

### "Still Showing 769 Golfers"

**Cause**: Migration not applied OR golfer group not assigned

**Fix**:
1. Check Supabase SQL Editor - run migration again if needed
2. Verify the event has `assigned_golfer_group_id` set:
   ```sql
   SELECT name, assigned_golfer_group_id 
   FROM clubhouse_competitions
   WHERE event_id = 'YOUR_EVENT_ID';
   ```
3. If NULL, the group wasn't assigned during creation - need to update edit page

### "Error: Could not find column 'assigned_golfer_group_id'"

**Cause**: Migration not applied

**Fix**: Run the SQL migration in Supabase SQL Editor (see Step 1 above)

### "Golfer Group Dropdown is Empty"

**Cause**: No golfer groups exist in database

**Fix**: Create a group in InPlay Admin first (Step 2 above)

---

## Architecture

### How Team Builder Fetches Golfers

```typescript
// apps/golf/src/app/clubhouse/build-team/[eventId]/page.tsx (lines 210-250)

if (competition.assigned_golfer_group_id) {
  // ✅ Fetch from golfer_group_members (RESTRICTED)
  const { data: groupGolfers } = await supabase
    .from('golfer_group_members')
    .select('golfer:golfers(...)')
    .eq('group_id', competition.assigned_golfer_group_id);
    
  golfers = groupGolfers.map(item => item.golfer);
} else {
  // ⚠️ Fetch ALL golfers (FALLBACK - 769 golfers!)
  const { data: allGolfers } = await supabase
    .from('golfers')
    .select('*')
    .order('world_ranking');
    
  golfers = allGolfers;
}
```

**Logic**:
- If `assigned_golfer_group_id` is set → Query `golfer_group_members` table
- If NULL → Query entire `golfers` table (fallback)

### Database Tables

```
golfer_groups
├── id (UUID)
├── name (TEXT) - "Alfred Dunhill Championship"
└── created_at

golfer_group_members
├── group_id → golfer_groups(id)
├── golfer_id → golfers(id)
└── (junction table)

clubhouse_competitions
├── id
├── event_id
├── assigned_golfer_group_id → golfer_groups(id) ← NEW COLUMN
└── (other fields...)

clubhouse_events
├── id
├── name
├── default_golfer_group_id → golfer_groups(id) ← NEW COLUMN
└── (other fields...)
```

---

## Next Steps

### Short Term (Manual Process)
1. ✅ Run migration (Step 1)
2. ✅ Create golfer groups in InPlay admin
3. ✅ Create events with groups assigned
4. ✅ Test team builder shows correct golfers

### Future Enhancements
- [ ] Add golfer group selector to **edit page** (currently missing)
- [ ] Bulk-copy golfer groups from InPlay tournaments
- [ ] Auto-suggest group based on event name matching
- [ ] Show golfer count next to group name in dropdown
- [ ] Add "Create New Group" button directly in clubhouse admin

---

## Related Files

**Migration**: `scripts/clubhouse/add-golfer-groups.sql`  
**API**: `apps/golf/src/app/api/clubhouse/events/route.ts` (line 228 - passes `assigned_golfer_group_id`)  
**Create Page**: `apps/admin/src/app/clubhouse/events/create/page.tsx` (line 244 - golfer group dropdown)  
**Team Builder**: `apps/golf/src/app/clubhouse/build-team/[eventId]/page.tsx` (line 210 - golfer fetch logic)  
**UI Fixed**: `apps/golf/src/app/clubhouse/page.tsx` (button color + badge text)

# 🚨 GOLFER GROUPS SYSTEM - Migration & Setup Guide

## ⚠️ IMPORTANT: Schema Change Required

The golfer system has been **completely redesigned** to use a group-based architecture. This is more scalable and efficient for managing 100+ golfers.

---

## 📋 What Changed?

### Old System (Previous Implementation)
- ❌ Added golfers one-by-one to tournaments
- ❌ No reusability across tournaments
- ❌ Messy when dealing with 100+ golfers

### New System (Group-Based)
- ✅ Create named golfer groups (e.g., "Masters 2025 - Full Field")
- ✅ Assign groups to tournaments (bulk add 100+ golfers instantly)
- ✅ Link specific golfers to specific competitions (Round 4 has fewer golfers after cut)
- ✅ Reusable groups across multiple tournaments

---

## 🗄️ Database Migration

### Step 1: Run the Migration
**File**: `scripts/2025-01-golfer-groups-system.sql`

**What it does**:
1. **Drops** old `tournament_golfers` table (if exists from previous implementation)
2. **Creates** 5 new tables:
   - `golfers` - Master golfer database
   - `golfer_groups` - Named collections (e.g., "Masters Full Field")
   - `golfer_group_members` - Links golfers to groups
   - `tournament_golfer_groups` - Links groups to tournaments
   - `competition_golfers` - Links golfers to specific competitions
3. **Sets up** RLS policies (read: public, write: admin)
4. **Creates** indexes for fast lookups
5. **Inserts** sample data (10 golfers, 4 groups)

**Steps**:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `scripts/2025-01-golfer-groups-system.sql`
4. Click "Run"
5. ✅ Should see success message with sample data count

**⚠️ WARNING**: This will delete any data in the old `tournament_golfers` table. If you have important data, export it first.

---

## 🏗️ New Database Structure

```
golfers (156 individual golfers)
    ↓
golfer_groups (4 named collections)
    ├─ "Masters 2025 - Full Field" (96 golfers)
    ├─ "Masters 2025 - After Cut" (50 golfers)
    ├─ "PGA Championship 2025" (156 golfers)
    └─ "Top 10 World Ranking" (10 golfers)
    ↓
tournament_golfer_groups (assign groups to tournaments)
    ↓
competition_golfers (specific golfers in specific competitions)
```

---

## 🎯 User Workflows

### Workflow 1: Create a Golfer Group
**URL**: `/golfers/groups` (NEW PAGE)

1. Click "Create Group"
2. Fill in:
   - Name: "Masters 2025 - Full Field"
   - Slug: "masters-2025-full"
   - Description: "All 96 golfers in The Masters 2025"
   - Color: #006747 (green)
3. Save group
4. Add golfers:
   - Select from master list
   - Or bulk import from CSV (future)
   - Or sync from API (future)

### Workflow 2: Assign Group to Tournament
**URL**: `/tournaments/[id]` → Golfers Tab

1. Edit a tournament
2. Go to "Golfers" tab
3. Click "Add Group"
4. Select "Masters 2025 - Full Field"
5. ✅ 96 golfers instantly available to tournament

### Workflow 3: Assign Golfers to Competition
**URL**: Competition card → "Manage Golfers"

1. On tournament edit page, find a competition (e.g., "Round 1")
2. Click "Manage Golfers"
3. Select source group: "Masters 2025 - Full Field"
4. Click "Add All from Group"
5. ✅ 96 golfers added to Round 1

For Round 4 (after cut):
1. Click "Manage Golfers" on "Round 4"
2. Select source group: "Masters 2025 - After Cut"
3. Click "Add All from Group"
4. ✅ Only 50 golfers added to Round 4

---

## 📁 New Files Created

### Database
- `scripts/2025-01-golfer-groups-system.sql` - Complete schema migration

### API Routes
- `/api/golfer-groups` - List/create groups
- `/api/golfer-groups/[id]` - Get/update/delete group
- `/api/golfer-groups/[id]/members` - Manage group members
- `/api/tournaments/[id]/golfer-groups` - Assign groups to tournaments
- `/api/competitions/[id]/golfers` - Manage competition golfers

### UI Pages (To Be Created)
- `/golfers/groups` - List and manage golfer groups
- `/golfers/groups/[id]` - Edit group and manage members
- Tournament edit page → Golfers tab (updated)
- Competition card → Manage Golfers modal (new)

### Documentation
- `docs/GOLFER-GROUPS-PLAN.md` - Full architecture plan
- `docs/GOLFER-GROUPS-MIGRATION.md` - This file

---

## 🔧 API Endpoints

### Golfer Groups
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/golfer-groups` | List all groups with member counts |
| POST | `/api/golfer-groups` | Create new group |
| GET | `/api/golfer-groups/[id]` | Get group with members |
| PUT | `/api/golfer-groups/[id]` | Update group details |
| DELETE | `/api/golfer-groups/[id]` | Delete group (if not in use) |

### Group Members
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/golfer-groups/[id]/members` | List golfers in group |
| POST | `/api/golfer-groups/[id]/members` | Add golfer(s) to group |
| DELETE | `/api/golfer-groups/[id]/members?golfer_id=X` | Remove golfer from group |

### Tournament Groups
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tournaments/[id]/golfer-groups` | List groups in tournament |
| POST | `/api/tournaments/[id]/golfer-groups` | Assign group to tournament |
| DELETE | `/api/tournaments/[id]/golfer-groups?group_id=X` | Remove group from tournament |

### Competition Golfers
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/competitions/[id]/golfers` | List golfers in competition |
| POST | `/api/competitions/[id]/golfers` | Add golfer(s) to competition |
| POST | `/api/competitions/[id]/golfers` with `from_group_id` | Add all from group |
| DELETE | `/api/competitions/[id]/golfers?golfer_id=X` | Remove golfer |
| DELETE | `/api/competitions/[id]/golfers?all=true` | Remove all golfers |

---

## ✅ Sample Data Included

After running the migration, you'll have:

### 10 Sample Golfers
- Tiger Woods
- Rory McIlroy
- Jon Rahm
- Scottie Scheffler
- Brooks Koepka
- Dustin Johnson
- Jordan Spieth
- Justin Thomas
- Collin Morikawa
- Xander Schauffele

### 4 Sample Groups
| Group | Golfers | Color |
|-------|---------|-------|
| Masters 2025 - Full Field | 10 | 🟢 Green |
| Masters 2025 - After Cut | 5 | 🟡 Gold |
| PGA Championship 2025 | 0 | 🔵 Blue |
| Top 10 World Ranking | 0 | 🔴 Red |

---

## 🚀 Next Steps (After Migration)

1. ✅ Run migration: `2025-01-golfer-groups-system.sql`
2. ⏳ Create UI pages (in progress):
   - Golfer groups list page
   - Group edit page
   - Tournament golfers tab
   - Competition golfers modal
3. ⏳ Test workflows:
   - Create a group
   - Add golfers to group
   - Assign group to tournament
   - Link golfers to competitions

---

## 🐛 Troubleshooting

**Migration fails with "relation already exists"**:
- Tables from old implementation exist
- Solution: The migration drops them automatically
- If still fails, manually drop: `DROP TABLE IF EXISTS tournament_golfers CASCADE;`

**"Cannot delete group" error**:
- Group is assigned to tournaments
- Solution: Remove from all tournaments first, then delete

**No sample data showing**:
- Check INSERT statements in migration file
- Verify RLS policies are set correctly
- Check Supabase logs for errors

---

## 📊 Benefits of New System

| Feature | Old System | New System |
|---------|------------|------------|
| Add 100 golfers | 100 clicks | 1 click (add group) |
| Reuse across tournaments | ❌ No | ✅ Yes |
| Different golfers per competition | ❌ Manual | ✅ Group-based |
| Update golfer list | Update each tournament | Update group once |
| CSV import | ❌ No | ✅ Yes (coming) |

---

**Status**: ✅ Migration Ready
**Next**: Run migration, then test UI (to be created)

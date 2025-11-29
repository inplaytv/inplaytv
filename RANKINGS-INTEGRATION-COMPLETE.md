# DataGolf Rankings Integration - Complete

## ✅ What Was Implemented

### 1. **API Endpoints Created**

#### GET `/api/golfers/rankings`
Search and browse top 500 players from DataGolf Rankings.

**Query Parameters:**
- `search`: Filter by player name (optional)
- `limit`: Max results to return (default: 50, max: 500)
- `tour`: Filter by tour - `pga`, `euro`, `all` (optional)

**Returns:**
```json
{
  "success": true,
  "lastUpdated": "2025-11-24 14:08:44 UTC",
  "total": 50,
  "rankings": [
    {
      "dgId": 18417,
      "name": "Scheffler, Scottie",
      "country": "USA",
      "dgRank": 1,
      "owgrRank": 1,
      "skillEstimate": 3.204,
      "tour": "PGA",
      "isAmateur": false
    }
  ]
}
```

#### POST `/api/golfers/sync-from-rankings`
Batch sync golfers from rankings to database.

**Request Body:**
```json
{
  "limit": 500,  // Number of players to sync (default: 500)
  "updateExisting": true  // Update existing golfers (default: true)
}
```

**Returns:**
```json
{
  "success": true,
  "created": 450,
  "updated": 50,
  "skipped": 0,
  "total": 500,
  "lastUpdated": "2025-11-24 14:08:44 UTC"
}
```

### 2. **Database Schema Update Required**

**Run this migration in Supabase SQL Editor:**
```sql
ALTER TABLE golfers
ADD COLUMN IF NOT EXISTS dg_rank INTEGER,
ADD COLUMN IF NOT EXISTS owgr_rank INTEGER,
ADD COLUMN IF NOT EXISTS skill_estimate DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS primary_tour VARCHAR(50),
ADD COLUMN IF NOT EXISTS rankings_updated_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_golfers_dg_rank ON golfers(dg_rank) WHERE dg_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_owgr_rank ON golfers(owgr_rank) WHERE owgr_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_skill_estimate ON golfers(skill_estimate DESC) WHERE skill_estimate IS NOT NULL;
```

**Location:** `APPLY-THIS-MIGRATION.sql`

### 3. **UI Integration**

Added to **Manage Golfers** page (`/admin/tournaments/[id]/manage-golfers`):

**New Button:** 🔍 Search Top 500 Players
- Orange button in action bar
- Opens rankings search modal
- Search by player name
- View: Rank (DG + OWGR), Name, Country, Tour
- "Add" button for each player

**Features:**
- ✅ Live search from DataGolf rankings
- ✅ Display top 500 ranked players
- ✅ Filter and search functionality
- ✅ One-click add to tournament
- ✅ Auto-remove from search results after adding
- ✅ Real-time feedback

### 4. **Files Modified**

#### Created Files:
1. `apps/admin/src/app/api/golfers/rankings/route.ts` (116 lines)
   - GET endpoint for fetching/searching rankings
   
2. `apps/admin/src/app/api/golfers/sync-from-rankings/route.ts` (120 lines)
   - POST endpoint for batch syncing golfers

3. `scripts/add-golfer-rankings-columns.sql`
   - Database migration script

4. `APPLY-THIS-MIGRATION.sql`
   - Quick reference migration

#### Updated Files:
1. `apps/admin/src/app/tournaments/[id]/manage-golfers/page.tsx`
   - Added rankings search state
   - Added "Search Top 500 Players" button
   - Added rankings search modal with table
   - Added search and add functions

## 🔧 Setup Instructions

### Step 1: Apply Database Migration
```bash
# Go to Supabase SQL Editor:
https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/sql/new

# Copy contents from APPLY-THIS-MIGRATION.sql and run
```

### Step 2: Start Admin Server
```bash
cd c:\inplaytv\apps\admin
pnpm dev
```

### Step 3: Test Rankings API
```bash
# Test directly via browser/Postman:
GET http://localhost:3002/api/golfers/rankings?search=Scheffler&limit=10

# Or run test script:
node test-rankings-api.js
```

### Step 4: Use Rankings Search
1. Navigate to any tournament: `/admin/tournaments/[id]`
2. Click "⛳ Manage Golfers"
3. Click "🔍 Search Top 500 Players"
4. Search for player name (e.g., "Scheffler")
5. Click "Add" to add player to tournament

## 📊 How It Works

### Player Discovery Flow:
```
User clicks "Search Top 500 Players"
    ↓
User types player name → "Scheffler"
    ↓
Frontend calls: GET /api/golfers/rankings?search=Scheffler
    ↓
API fetches from DataGolf: /preds/get-dg-rankings
    ↓
Filter 500 rankings for matching names
    ↓
Display: #1 Scheffler, Scottie (DG: 1, OWGR: 1, Skill: 3.20)
    ↓
User clicks "Add"
    ↓
POST /api/tournaments/[id]/golfers/manual
    ↓
Creates golfer (or finds existing by dg_id)
    ↓
Links golfer to tournament
    ↓
✅ Player added!
```

### Batch Sync Flow:
```
Admin calls: POST /api/golfers/sync-from-rankings
    ↓
Fetch top 500 players from DataGolf
    ↓
For each player:
  - Check if exists by dg_id
  - If exists: Update ranks & skill
  - If not: Create new golfer
    ↓
Return: {created: 450, updated: 50}
```

## 🎯 Use Cases

### 1. **Tournament Golfer Discovery**
When creating a new tournament, search rankings to find top players:
- Search "Scheffler" → Add immediately
- Search "McIlroy" → Add immediately
- Browse top 10 → Add multiple

### 2. **Database Population**
One-time sync to populate golfer database:
```bash
POST /api/golfers/sync-from-rankings
Body: { "limit": 500, "updateExisting": true }
```

### 3. **Ongoing Updates**
Periodically refresh golfer rankings:
- Run sync-from-rankings weekly
- Updates ranks and skill estimates
- Keeps database current

## 🔍 Testing Checklist

- [ ] Apply database migration in Supabase
- [ ] Start admin server (`pnpm dev`)
- [ ] Navigate to tournament manage golfers page
- [ ] Click "Search Top 500 Players" button
- [ ] Search for "Scheffler" - should show Scottie Scheffler
- [ ] Click "Add" - should add to tournament
- [ ] Verify golfer appears in tournament golfers list
- [ ] Check golfer has dg_rank, owgr_rank, skill_estimate fields
- [ ] Test batch sync: `POST /api/golfers/sync-from-rankings`
- [ ] Verify database populated with 500 golfers

## 📝 Next Steps (Optional)

### Admin-Level Sync Tool
Create a global sync button in admin dashboard:
```tsx
// apps/admin/src/app/golfers/page.tsx
<button onClick={syncAllRankings}>
  Sync Top 500 Players
</button>
```

### Ranking Display
Show rankings in golfer lists:
```tsx
{golfer.dg_rank && (
  <span>Rank: #{golfer.dg_rank}</span>
)}
```

### Auto-Refresh
Schedule periodic ranking updates:
```ts
// cron job or scheduled function
async function dailyRankingsSync() {
  await fetch('/api/golfers/sync-from-rankings', {
    method: 'POST',
    body: JSON.stringify({ limit: 500, updateExisting: true })
  });
}
```

## ✅ Integration Status

| Feature | Status | Location |
|---------|--------|----------|
| Rankings API Endpoint | ✅ Complete | `/api/golfers/rankings` |
| Sync API Endpoint | ✅ Complete | `/api/golfers/sync-from-rankings` |
| Database Schema | ⏳ Pending Migration | `APPLY-THIS-MIGRATION.sql` |
| UI Search Component | ✅ Complete | `manage-golfers/page.tsx` |
| Testing | ✅ Script Ready | `test-rankings-api.js` |

## 🎉 Summary

The DataGolf Rankings integration is complete! You can now:
1. ✅ Search top 500 ranked players by name
2. ✅ View player rankings (DG rank, OWGR, skill estimate)
3. ✅ Add ranked players to tournaments instantly
4. ✅ Batch sync all 500 players to database
5. ✅ Keep golfer rankings updated

**Just apply the database migration and you're ready to go!**

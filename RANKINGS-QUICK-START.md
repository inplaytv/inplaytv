# DataGolf Rankings Integration - Quick Start Guide

## 🎯 What You Now Have

You now have a **4-way golfer management system** for tournaments:

### Method 1: 🔄 Sync from DataGolf (Field Updates)
- **When:** Active tournament with published field
- **Use:** Automatically import current tournament field
- **Button:** Green "Sync from DataGolf"
- **Note:** Only works when DataGolf has field data available

### Method 2: 🔍 Search Top 500 Rankings ⭐ **NEW!**
- **When:** Anytime, any tournament
- **Use:** Discover and add top-ranked players
- **Button:** Orange "Search Top 500 Players"
- **Features:**
  - Search by player name
  - View DG Rank, OWGR, Skill Estimate
  - One-click add to tournament
  - Always available (not tournament-dependent)

### Method 3: ➕ Manual Add
- **When:** Have player info from external source
- **Use:** Add any golfer manually
- **Button:** Blue "Add Golfer Manually"
- **Fields:** Name, Country, DG ID, PGA Tour ID

### Method 4: 📤 CSV Bulk Upload
- **When:** Have list of many golfers
- **Use:** Batch import from spreadsheet
- **Button:** Purple "Bulk Upload CSV"
- **Format:** `name,country,dg_id,pga_tour_id`

---

## 🚀 How to Use Rankings Search

### Step-by-Step Example:

**Scenario:** Adding top players to a new tournament

1. **Navigate to Tournament**
   ```
   /admin/tournaments/123
   ```

2. **Click "⛳ Manage Golfers"**
   - Opens golfer management page

3. **Click "🔍 Search Top 500 Players"**
   - Orange button in action bar
   - Opens search modal

4. **Search for Players**
   ```
   Type: "Scheffler" → Enter
   ```
   
   **Results:**
   ```
   Rank  Player               Country  Tour  Action
   #1    Scheffler, Scottie  USA      PGA   [Add]
   (DG: 1, OWGR: 1, Skill: 3.20)
   ```

5. **Click "Add" Button**
   - Player instantly added to tournament
   - Removed from search results
   - Success message appears

6. **Repeat for More Players**
   ```
   Search: "McIlroy"  → Add
   Search: "Rahm"     → Add
   Search: "Fleetwood" → Add
   ```

7. **Done!**
   - All players appear in tournament golfers list
   - Ready for scoring

---

## 🔧 Initial Setup (ONE TIME)

### Step 1: Apply Database Migration
**Copy this to Supabase SQL Editor:**
https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/sql/new

```sql
ALTER TABLE golfers
ADD COLUMN IF NOT EXISTS dg_rank INTEGER,
ADD COLUMN IF NOT EXISTS owgr_rank INTEGER,
ADD COLUMN IF NOT EXISTS skill_estimate DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS primary_tour VARCHAR(50),
ADD COLUMN IF NOT EXISTS rankings_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_golfers_dg_rank ON golfers(dg_rank) WHERE dg_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_owgr_rank ON golfers(owgr_rank) WHERE owgr_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_skill_estimate ON golfers(skill_estimate DESC) WHERE skill_estimate IS NOT NULL;
```

### Step 2: (Optional) Populate Database
**Sync all 500 ranked players to your database:**

Using Postman/curl:
```bash
POST http://localhost:3002/api/golfers/sync-from-rankings
Content-Type: application/json

{
  "limit": 500,
  "updateExisting": true
}
```

Or create a test script:
```javascript
// test-sync-rankings.js
fetch('http://localhost:3002/api/golfers/sync-from-rankings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ limit: 500, updateExisting: true })
})
  .then(r => r.json())
  .then(console.log);
```

**Result:**
```json
{
  "success": true,
  "created": 450,   // New golfers added
  "updated": 50,    // Existing golfers updated
  "skipped": 0,     // Duplicates skipped
  "total": 500,     // Total processed
  "lastUpdated": "2025-11-24 14:08:44 UTC"
}
```

---

## 💡 Pro Tips

### When to Use Each Method:

**Use Rankings Search When:**
- ✅ Starting a new tournament (no field data yet)
- ✅ Looking for specific high-ranked players
- ✅ Want to see player skill levels
- ✅ Need reliable, always-available data

**Use Sync from DataGolf When:**
- ✅ Tournament field is published
- ✅ Want exact tournament lineup
- ✅ Have tee times and official data
- ✅ Tournament is starting soon

**Use Manual Add When:**
- ✅ Player not in rankings (< top 500)
- ✅ Have player info from other source
- ✅ Local/regional player
- ✅ Quick one-off addition

**Use CSV Upload When:**
- ✅ Have list in spreadsheet
- ✅ Adding 10+ players at once
- ✅ Data from external source
- ✅ Batch operations

---

## 🎨 UI Walkthrough

### Manage Golfers Page Layout:

```
╔══════════════════════════════════════════════════════╗
║  Tournament Details                                  ║
║  Name: The Masters 2025 | Status: upcoming           ║
╠══════════════════════════════════════════════════════╣
║  Actions:                                            ║
║  [🔄 Sync from DataGolf]  ← Green (field updates)   ║
║  [🔍 Search Top 500]      ← Orange (rankings) NEW!   ║
║  [➕ Add Manually]        ← Blue (manual entry)      ║
║  [📤 Bulk Upload CSV]    ← Purple (CSV import)      ║
╠══════════════════════════════════════════════════════╣
║  [Rankings Search Modal] (when orange button clicked)║
║  ┌────────────────────────────────────────────────┐ ║
║  │ Search: [Scheffler____________] [Search] [X]  │ ║
║  │                                                 │ ║
║  │ Results:                                        │ ║
║  │ ┌─────┬──────────────────┬───────┬──────┬────┐ │ ║
║  │ │Rank │ Player           │Country│ Tour │Act │ │ ║
║  │ ├─────┼──────────────────┼───────┼──────┼────┤ │ ║
║  │ │#1   │Scheffler,Scottie│ USA   │ PGA  │Add │ │ ║
║  │ │DG:1 │                  │       │      │    │ │ ║
║  │ │OWGR:1                                        │ │ ║
║  │ └─────────────────────────────────────────────┘ │ ║
║  └────────────────────────────────────────────────┘ ║
╠══════════════════════════════════════════════════════╣
║  Current Golfers (15):                               ║
║  • Scheffler, Scottie (USA) [DG: 11417]             ║
║  • McIlroy, Rory (IRL) [DG: 10091]                  ║
║  • ...                                               ║
╚══════════════════════════════════════════════════════╝
```

---

## 📊 Rankings Data Explained

### What the Numbers Mean:

**DG Rank (DataGolf Rank):**
- 1-500 ranking based on DataGolf's skill model
- Lower = better
- Example: #1 = best player in the world

**OWGR Rank (Official World Golf Ranking):**
- Official PGA Tour ranking
- Used for tournament eligibility
- May differ from DG rank

**Skill Estimate:**
- DataGolf's statistical rating
- Higher = better
- Example: 3.20 = exceptional, 1.50 = very good
- Measured in strokes-gained vs average PGA field

**Tour:**
- Primary tour player competes on
- PGA = PGA Tour
- Euro = DP World Tour (European)

---

## 🧪 Testing the Integration

### Quick Test:

1. **Start Admin Server**
   ```bash
   cd c:\inplaytv\apps\admin
   pnpm dev
   ```

2. **Open Browser**
   ```
   http://localhost:3002/admin/tournaments
   ```

3. **Select Any Tournament → Click "⛳ Manage Golfers"**

4. **Click "🔍 Search Top 500 Players"**

5. **Type: "Scheffler"**

6. **Verify You See:**
   - Scottie Scheffler in results
   - Rank #1 displayed
   - OWGR, skill estimate shown

7. **Click "Add"**

8. **Verify:**
   - Success message appears
   - Player added to golfers list
   - Player removed from search results

✅ **If all above works, integration is successful!**

---

## 🔄 Keeping Rankings Updated

Rankings data from DataGolf is updated frequently. To keep your database current:

### Option 1: Manual Refresh (Recommended)
Run sync periodically:
```bash
POST /api/golfers/sync-from-rankings
Body: { "limit": 500, "updateExisting": true }
```

### Option 2: Scheduled Job (Future Enhancement)
Create a cron job or scheduled function to run weekly:
```typescript
// Run every Monday at 2am
cron.schedule('0 2 * * 1', async () => {
  await syncRankingsFromDataGolf();
});
```

---

## 📈 Benefits of Rankings Integration

✅ **Player Discovery** - Find top players easily
✅ **Skill-Based Selection** - See player skill levels
✅ **Always Available** - Not dependent on tournament fields
✅ **Database Enrichment** - Add ranking data to existing golfers
✅ **Smart Deduplication** - Reuses existing golfers by dg_id
✅ **Real-Time Data** - Fresh rankings from DataGolf

---

## 🎯 Summary

You now have a complete golfer management system with **4 different methods** to add players to tournaments. The new **Rankings Search** feature gives you instant access to the world's top 500 players with their current rankings and skill levels.

**Just apply the database migration and start using it!**

See `RANKINGS-INTEGRATION-COMPLETE.md` for full technical details.

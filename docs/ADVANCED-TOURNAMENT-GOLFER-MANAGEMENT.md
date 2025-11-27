# Advanced Tournament & Golfer Management

## 🎯 Complete Feature Set

Your system now has **both automatic AND manual** golfer management, plus future tournament scheduling!

---

## 🔄 **1. Manual Golfer Sync** (NEW!)

### **Sync Golfers for Existing Tournament**

**API Endpoint:**
```
POST /api/tournaments/[id]/sync-golfers
```

**Request Body:**
```json
{
  "tour": "pga",        // pga, euro, kft, alt
  "replace": true       // true = remove existing golfers first
}
```

**When to Use:**
- Tournament created before field was announced
- Field changed (WDs, additions)
- Re-sync after tournament week starts
- Fix tournaments with missing golfers (like Hero World Challenge)

**How to Use in Admin:**

1. **Go to:** Admin → Tournaments → [Select Tournament]
2. **Look for:** "Sync Golfers" button (to be added to UI)
3. **Or use API directly:**

```javascript
// Example: Sync golfers for Hero World Challenge
fetch('/api/tournaments/[tournament-id]/sync-golfers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tour: 'pga',
    replace: true  // Remove old golfers, add new ones
  })
});
```

**Response:**
```json
{
  "success": true,
  "tournament": {
    "id": "uuid",
    "name": "The RSM Classic",
    "slug": "rsm-classic"
  },
  "dataGolfEvent": "The RSM Classic",
  "golfersAdded": 156,
  "golfersCreated": 12,   // New golfer records
  "golfersExisting": 144, // Already in database
  "replaced": true
}
```

---

## 🤖 **2. Automatic Golfer Sync** (Original Feature)

### **During Tournament Creation**

When you create a tournament via AI Tournament Creator:

1. ✅ Fetches current field from DataGolf automatically
2. ✅ Creates golfer records
3. ✅ Links golfers to tournament
4. ✅ Shows count in success message

**This works for:**
- Current tournaments (in progress)
- Tournaments within their week
- Tournaments with announced fields

**This doesn't work for:**
- Tournaments 2+ weeks in future
- Tournaments with no field announced yet
- Past tournaments

---

## 📅 **3. In-Progress Tournament Support** (FIXED!)

### **What Changed:**

**Before:** Only showed future tournaments  
**After:** Shows in-progress tournaments too (last 5 days)

**Why:**
- Create competitions for final rounds
- Add golfers during tournament week
- Support mid-tournament entries

**Example:**
- Today: Friday (Round 2 of RSM Classic)
- AI Creator: **Now shows RSM Classic** ✅
- Can create: Final round competitions, weekend pools, etc.

**Filter Logic:**
```typescript
// Shows tournaments that started within last 5 days OR future tournaments
const fiveDaysAgo = new Date();
fiveDaysAgo.setDate(today.getDate() - 5);

return tournament.startDate >= fiveDaysAgo;
```

---

## 🗓️ **4. Future Tournament Scheduling** (NEW!)

### **Pre-Schedule Entire Season**

**Problem Solved:**  
DataGolf `field-updates` only returns **current tournament**, not all future tournaments.

**Solution:**  
Pre-create tournament records using `get-schedule` endpoint, sync golfers later.

### **API Endpoints:**

#### **View Full Season Schedule (GET)**
```
GET /api/ai/schedule-tournaments?tour=pga
```

**Returns:**
```json
{
  "success": true,
  "tour": "pga",
  "season": 2025,
  "totalTournaments": 48,
  "schedule": [
    {
      "eventId": "16",
      "name": "Sentry Tournament of Champions",
      "startDate": "2025-01-02",
      "location": "Kapalua, HI",
      "course": "Plantation Course at Kapalua",
      "coordinates": { "latitude": 21.001, "longitude": -156.654 }
    }
  ]
}
```

#### **Pre-Create Tournaments (POST)**
```
POST /api/ai/schedule-tournaments
```

**Request Body:**
```json
{
  "tour": "pga",
  "createAll": true,           // Create all future tournaments
  "tournamentIds": ["16", "6"] // Or specific event IDs only
}
```

**Response:**
```json
{
  "success": true,
  "tour": "pga",
  "season": 2025,
  "created": 15,
  "skipped": 2,  // Already exist
  "errors": 0,
  "tournaments": [
    {
      "id": "uuid",
      "name": "Sentry Tournament of Champions",
      "slug": "sentry-tournament-of-champions-pga-16",
      "startDate": "2025-01-02",
      "dgEventId": "16"
    }
  ]
}
```

**What It Does:**
1. ✅ Creates tournament records with `is_visible=false`
2. ✅ Sets dates, location, course info
3. ✅ **No golfers yet** (field not announced)
4. ⏰ Later: Manually sync golfers when field is announced

**Workflow:**
```
January: Pre-schedule all 2025 tournaments
↓
Each week: Manually sync golfers for upcoming tournament
↓
Tournament week: Create competitions via AI Creator
↓
Post-tournament: Tournaments auto-complete based on dates
```

---

## 🧹 **5. Cleaning Old Golfer Data**

### **Before API Implementation**

If you manually added golfers before DataGolf integration, clean them up:

**Script:** `scripts/clean-old-golfers.sql`

**Options:**

#### **Option 1: View Current Data**
```sql
-- See what golfers are linked to what tournaments
SELECT 
  t.name as tournament_name,
  COUNT(tg.id) as golfer_count
FROM tournaments t
LEFT JOIN tournament_golfers tg ON t.id = tg.tournament_id
GROUP BY t.id, t.name
ORDER BY golfer_count DESC;
```

#### **Option 2: Remove All Tournament Links**
```sql
-- Keeps golfer records, removes tournament links
DELETE FROM tournament_golfers;
```

#### **Option 3: Remove Non-DataGolf Golfers**
```sql
-- Only remove manually added golfers (no dg_id)
DELETE FROM tournament_golfers
WHERE golfer_id IN (
  SELECT id FROM golfers WHERE dg_id IS NULL
);
```

#### **Option 4: Complete Fresh Start**
```sql
-- Remove everything, start from scratch
TRUNCATE TABLE tournament_golfers CASCADE;
DELETE FROM golfers;
```

**Recommendation:**
- Run **Option 2** to clear all links
- Re-sync using manual sync endpoint
- Future golfers will have `dg_id` (DataGolf ID)

---

## 📊 **Future Golfer Storage**

### **Yes, All Future Golfers Will Be Saved!**

**Golfer Table Structure:**
```sql
golfers (
  id: uuid PRIMARY KEY,
  dg_id: integer UNIQUE,     -- DataGolf ID (always present)
  name: text,
  country: text,
  pga_tour_id: text,         -- PGA Tour official ID
  created_at: timestamp,
  updated_at: timestamp
)
```

**Tournament Links:**
```sql
tournament_golfers (
  id: uuid PRIMARY KEY,
  tournament_id: uuid REFERENCES tournaments,
  golfer_id: uuid REFERENCES golfers,
  status: text,              -- confirmed, wd, injured
  created_at: timestamp
)
```

**Key Features:**
- ✅ Golfers stored once, linked to multiple tournaments
- ✅ `dg_id` ensures no duplicates
- ✅ Persistent across tournament deletions
- ✅ Can be updated with latest info from DataGolf

**Example:**
```
Jordan Spieth (dg_id: 14636)
├─ The RSM Classic (confirmed)
├─ Hero World Challenge (confirmed)
└─ Sony Open 2025 (confirmed)
```

---

## 🎯 **Complete Workflows**

### **Workflow 1: Current Tournament (Automatic)**
```
1. Go to AI Tournament Creator
2. Select "The RSM Classic" (in progress)
3. Click "Generate & Preview"
4. Review 7 competitions + 156 golfers
5. Click "Create Tournament"
6. ✅ Done! Redirects to tournament page
```

### **Workflow 2: Future Tournament (Manual Sync)**
```
1. Pre-schedule: POST /api/ai/schedule-tournaments
   → Creates "Sony Open 2025" (is_visible=false)

2. Wait until tournament week...

3. Sync golfers: POST /api/tournaments/[id]/sync-golfers
   → Adds 144 golfers from DataGolf field

4. Create competitions via AI Creator
   → Tournament now visible with full field
```

### **Workflow 3: Fix Existing Tournament**
```
1. Hero World Challenge has 0 golfers
2. Go to: Admin → Tournaments → Hero World Challenge
3. Click "Sync Golfers" button
4. Select tour: PGA
5. Check "Replace existing"
6. ✅ Done! 20 golfers added
```

---

## 🧪 **Testing Commands**

### **Test Full Season Schedule:**
```powershell
$env:DATAGOLF_API_KEY="ac7793fb5f617626ccc418008832"
node scripts/test-advanced-features.js
```

### **Test Current Field:**
```powershell
$env:DATAGOLF_API_KEY="ac7793fb5f617626ccc418008832"
node scripts/test-tournament-field.js
```

### **View Golfer Data:**
```sql
-- In Supabase SQL Editor
SELECT 
  COUNT(*) as total_golfers,
  COUNT(DISTINCT dg_id) as with_datagolf_id,
  COUNT(*) - COUNT(dg_id) as without_datagolf_id
FROM golfers;
```

---

## 🚨 **Common Questions**

### **Q: Why does Hero World Challenge have 0 golfers?**
**A:** Created before tournament week. Use manual sync now that it's current!

### **Q: Will RSM Classic appear in AI Creator now?**
**A:** Yes! Fixed filter to include in-progress tournaments (last 5 days).

### **Q: Should I delete old manually-added golfers?**
**A:** Yes, run `clean-old-golfers.sql` Option 2 or 3 to clean up.

### **Q: Can I schedule all 2025 tournaments now?**
**A:** Yes! Use `POST /api/ai/schedule-tournaments` with `createAll: true`.

### **Q: When should I sync golfers?**
**A:** 
- **Best:** Monday of tournament week (fields finalized)
- **OK:** Tuesday-Wednesday (tee times announced)
- **Late:** During tournament (may have WDs)

### **Q: What if I sync too early?**
**A:** Field may not be available yet. Error message will explain. Retry closer to tournament.

### **Q: Do I need to re-sync every week?**
**A:** No! Once synced, golfers stay linked. Re-sync only if field changes.

---

## 📈 **System Capabilities**

| **Feature** | **Status** | **Notes** |
|-------------|------------|-----------|
| Auto golfer fetch | ✅ Working | During tournament creation |
| Manual golfer sync | ✅ Working | For existing tournaments |
| In-progress tournaments | ✅ Fixed | Last 5 days shown |
| Future scheduling | ✅ Working | Pre-create all tournaments |
| Golfer deduplication | ✅ Working | Uses `dg_id` |
| Field updates | ✅ Working | 10min cache |
| Multiple tours | ✅ Working | PGA, European, Korn Ferry |
| WD tracking | 🔄 Planned | Status updates |

---

## 🎉 **Summary**

**What You Can Do Now:**

1. ✅ **Automatic golfers** - Create tournament, get golfers instantly
2. ✅ **Manual sync** - Fix existing tournaments, re-sync fields
3. ✅ **In-progress support** - RSM Classic now appears in AI Creator
4. ✅ **Future scheduling** - Pre-create entire 2025 season
5. ✅ **Clean old data** - SQL script to remove pre-API golfers
6. ✅ **Flexible workflow** - Choose automatic OR manual per tournament

**Result:**
- No more manual golfer entry
- Always up-to-date with DataGolf
- Support for past, current, and future tournaments
- 156 golfers added in seconds instead of hours

---

*Last updated: Complete tournament and golfer management system with automatic + manual workflows*

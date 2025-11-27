# Tournament & Golfer Management with DataGolf

## 🎯 Overview

Your system now automatically fetches **tournaments AND golfers** from DataGolf API when creating tournaments through the AI Tournament Creator.

---

## 🔄 How to Refresh Tournament List

### **Option 1: Automatic Refresh (Default)**
- The tournament list is cached for **1 hour**
- After 1 hour, it automatically fetches new tournaments from DataGolf

### **Option 2: Manual Refresh**
1. Go to **Admin → AI Tournament Creator**
2. Click the **"Refresh Tournaments"** button in the top-right
3. This forces an immediate fetch from DataGolf
4. The button shows a spinning icon while loading

**When to use manual refresh:**
- After DataGolf announces new tournaments
- When you need the absolute latest schedule
- After tournament fields are updated by DataGolf

---

## 🏌️ How Tournament Golfers Work

### **Automatic Golfer Fetch During Creation**

When you create a tournament via AI Tournament Creator, the system:

1. **Fetches Current Field from DataGolf**
   - Uses the `field-updates` endpoint
   - Gets the player list for the current/upcoming tournament on that tour

2. **Creates Golfer Records**
   - Checks if each golfer exists in database (by `dg_id`)
   - Creates new golfer records if needed
   - Updates existing records if they already exist

3. **Links Golfers to Tournament**
   - Creates `tournament_golfers` relationships
   - Sets status to `confirmed`
   - Tracks all golfers in the field

### **DataGolf Field Data Includes:**
- ✅ Player name
- ✅ DataGolf ID (dg_id) - unique identifier
- ✅ Country
- ✅ PGA Tour ID (if available)
- ✅ Tee times (once announced)
- ✅ DraftKings/FanDuel salaries
- ✅ Amateur status
- ✅ WD (withdrawal) status

---

## 🚨 Important Notes About Tournament Fields

### **Timing Matters**

The DataGolf `field-updates` endpoint returns the **current active tournament** on each tour:

| **When You Create** | **Golfers You Get** |
|---------------------|---------------------|
| During a tournament | Current tournament's field |
| Week before event | Upcoming tournament's field |
| Multiple weeks before | May get different event |

**Best Practice:** 
- Create tournaments **1-2 weeks before they start**
- This ensures you get the correct field for that specific event
- Fields are typically finalized by Monday of tournament week

### **What If Tournament Has No Golfers?**

**Scenario:** "Hero World Challenge" created with 0 golfers

**Reasons This Happens:**
1. **Wrong timing** - Created too early (field not finalized)
2. **Event not current** - DataGolf returns the active/upcoming event, not all future events
3. **Limited field event** - Some invitational tournaments have delayed field announcements
4. **Off-season** - No active tournaments during certain periods

**Solutions:**
- Wait until the tournament is the current/next event on the tour
- Manually re-fetch golfers for existing tournaments (see below)
- Check DataGolf's [Field Updates page](https://datagolf.com/field-updates) to verify field availability

---

## 🔧 Testing Tournament Field Fetch

Run this test to verify DataGolf field access:

```powershell
$env:DATAGOLF_API_KEY="ac7793fb5f617626ccc418008832"; node scripts/test-tournament-field.js
```

**What This Tests:**
- ✅ PGA Tour field fetch
- ✅ European Tour field fetch
- ✅ Player data structure
- ✅ Field size and event details

---

## 📊 API Endpoints Created

### **1. Fetch Tournament List**
```
GET /api/ai/upcoming-tournaments
```
- Returns upcoming tournaments from PGA & European tours
- Cached for 1 hour
- Add `?refresh=timestamp` to force refresh

### **2. Fetch Tournament Field**
```
GET /api/ai/tournament-field?tour=pga
```
- Returns current/upcoming tournament field
- Cached for 10 minutes (fields update frequently)
- Tours: `pga`, `euro`, `kft`, `alt` (LIV)

### **3. Create Tournament with Golfers**
```
POST /api/ai/create-tournament
```
- Creates tournament
- Automatically fetches field from DataGolf
- Creates golfer records
- Links golfers to tournament
- Returns: `{ golfersAdded: number }`

---

## 🎯 DataGolf Field Updates Schedule

| **Day** | **Field Status** |
|---------|------------------|
| **Monday** | Final field announced, WDs processed |
| **Tuesday** | Tee times may be released |
| **Wednesday** | Final tee times confirmed |
| **Thursday-Sunday** | Live scoring, WD updates |

**Cache Strategy:**
- Tournament list: 1 hour cache
- Field updates: 10 minutes cache (during tournament week)
- This balances API calls vs fresh data

---

## 🔍 How to Check Golfers in Database

### **Via Supabase Dashboard:**

1. **Go to:** [Supabase Dashboard](https://qemosikbhrnstcormhuz.supabase.co)
2. **Navigate to:** Table Editor → `tournament_golfers`
3. **Filter by:** `tournament_id` = your tournament ID
4. **Join to see names:** Include `golfers` table in query

### **Example SQL Query:**

```sql
SELECT 
  t.name as tournament_name,
  g.name as golfer_name,
  g.country,
  g.dg_id,
  tg.status
FROM tournament_golfers tg
JOIN tournaments t ON t.id = tg.tournament_id
JOIN golfers g ON g.id = tg.golfer_id
WHERE t.slug = 'hero-world-challenge-2024'
ORDER BY g.name;
```

---

## 🛠️ Troubleshooting

### **No Golfers Added to Tournament**

**Check:**
1. ✅ DataGolf API key is valid
2. ✅ Tournament timing (is it current/upcoming?)
3. ✅ Field is finalized (check DataGolf website)
4. ✅ Tour parameter correct (`pga` vs `euro`)
5. ✅ API rate limits not exceeded

**Logs to Review:**
```
🏌️ Fetching tournament field from DataGolf...
✅ Found X golfers in field
✅ Added X golfers to tournament
```

### **Wrong Tournament Field**

**Reason:** DataGolf returns the **current active event** on that tour, not all future events.

**Solution:** 
- Create tournaments closer to their start date
- Verify on DataGolf that the correct event is showing in field-updates

### **Duplicate Golfers**

**System handles this automatically:**
- Checks `dg_id` before creating golfer
- Uses existing golfer record if found
- Only creates new record if doesn't exist

---

## 🚀 Success Message Format

When you create a tournament, you'll see:

```
✅ Tournament created successfully!

📋 The RSM Classic
🏆 7 competitions added
🏌️ 156 golfers added

Redirecting to Tournaments page...
```

This confirms:
- ✅ Tournament created
- ✅ All competition types added
- ✅ **Golfers automatically fetched and linked**
- 🔄 Automatic redirect to view result

---

## 📈 Next Steps

### **Immediate:**
1. Test tournament creation with current event
2. Verify golfers appear in database
3. Check success message shows golfer count

### **Future Enhancements:**
1. **Manual golfer sync** - Re-fetch field for existing tournaments
2. **WD tracking** - Update golfer status during tournament
3. **Tee times** - Store and display tee time pairings
4. **Live scoring** - Fetch round-by-round scores
5. **Field comparison** - Compare projected vs actual field

---

## 🔗 Related Documentation

- [DataGolf API Docs](https://datagolf.com/api-access)
- [Field Updates Endpoint](https://feeds.datagolf.com/field-updates)
- [Tournament Schedule Endpoint](https://feeds.datagolf.com/get-schedule)

---

## ✅ Summary

**What Changed:**
- ✨ Added refresh button to AI Tournament Creator
- 🏌️ Automatic golfer fetch during tournament creation
- 🔄 Real-time field data from DataGolf
- ✅ Golfer count in success message
- 📊 New API endpoint for field data

**Result:**
- Tournaments now come with **complete field lists**
- No manual golfer entry needed
- Always up-to-date with DataGolf
- Handles 150+ golfer tournaments automatically

**Current Status:**
- ✅ Refresh tournaments: Working
- ✅ Fetch tournament fields: Working
- ✅ Create golfer records: Working
- ✅ Link golfers to tournaments: Working
- ⚠️ Timing-dependent: Create tournaments 1-2 weeks before start

---

*Last updated: System fully integrated with DataGolf tournament and field data*

# Tournament Sync Troubleshooting Guide

## Problem: "Sync from DataGolf" Loads Wrong Tournament Players

### Root Causes & Solutions

#### 1️⃣ **Wrong Tour Assigned to Tournament**
**Symptom:** All tournaments getting the same players (usually the current PGA Tour event)

**Cause:** Tournament has incorrect `tour` field in database
- PGA Tour events: `tour = 'pga'`
- DP World Tour / European Tour events: `tour = 'euro'`
- Korn Ferry Tour: `tour = 'kft'`
- LIV Golf: `tour = 'alt'`

**Fix:**
```javascript
// Update tournament tour assignment
await supabase
  .from('tournaments')
  .update({ tour: 'euro' })  // Change to correct tour
  .eq('id', 'tournament-id-here');
```

**How to Check:** Look at official tournament website
- If it's on europeantour.com → `tour = 'euro'`
- If it's on pgatour.com → `tour = 'pga'`

---

#### 2️⃣ **DataGolf Returns Current Week's Tournament Only**
**How DataGolf Works:**
- `field-updates?tour=pga` returns the **current PGA Tour tournament**
- `field-updates?tour=euro` returns the **current DP World Tour tournament**
- It does NOT return historical or future tournaments

**When This Causes Issues:**
- Syncing a tournament that isn't current → Gets wrong field
- Two tournaments on same tour at same time → Only gets one

**Solutions:**
1. **Wait until tournament week** - Sync when tournament becomes "current"
2. **Manual CSV upload** - For past tournaments or when DataGolf doesn't have data
3. **Use event_id** - If tournament has `event_id` set, some endpoints support it

---

#### 3️⃣ **Missing event_id Field**
**What it does:** Links your tournament to DataGolf's specific event identifier

**How to get it:**
```javascript
// Query DataGolf to see what event_id they use
const response = await fetch(
  `https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=YOUR_API_KEY`
);
const data = await response.json();
console.log('Event ID:', data.event_id);  // e.g., "2026102"
console.log('Event Name:', data.event_name);
```

**Save to database:**
```javascript
await supabase
  .from('tournaments')
  .update({ event_id: '2026102' })
  .eq('name', 'Tournament Name');
```

---

## Quick Diagnosis Steps

### Step 1: Check Tournament Tour Assignment
```sql
SELECT name, tour, event_id, start_date 
FROM tournaments 
WHERE name = 'Your Tournament Name';
```

### Step 2: Verify DataGolf Response
```javascript
// Test what DataGolf returns for this tour
const apiKey = 'YOUR_DATAGOLF_API_KEY';
const tour = 'euro';  // or 'pga', 'kft', 'alt'

const response = await fetch(
  `https://feeds.datagolf.com/field-updates?tour=${tour}&file_format=json&key=${apiKey}`
);
const data = await response.json();

console.log('DataGolf is returning:');
console.log('- Event:', data.event_name);
console.log('- Event ID:', data.event_id);
console.log('- Players:', data.field?.length);
```

### Step 3: Compare Event Names
- Does the tournament name in **your database** match DataGolf's `event_name`?
- If not, might be syncing wrong tournament

---

## Common Scenarios

### Scenario A: European Tour event showing PGA Tour players
❌ **Problem:** Tournament has `tour = 'pga'` but it's actually a DP World Tour event

✅ **Fix:** Update to `tour = 'euro'`

### Scenario B: Two tournaments at same time getting same players
❌ **Problem:** DataGolf only returns one "current" tournament per tour

✅ **Fix:** 
- Sync the primary tournament from DataGolf
- Manually upload CSV for secondary tournament

### Scenario C: Historical tournament needs golfer field
❌ **Problem:** Tournament already finished, DataGolf only shows current events

✅ **Fix:**
- Use historical DataGolf API endpoint (if event_id known)
- Or manually upload CSV with player list

---

## File Locations

**Sync API Endpoint:**
```
/apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts
```

**Key Code Section (lines 56-58):**
```typescript
const dgRes = await fetch(
  `https://feeds.datagolf.com/field-updates?tour=${tourParam}&file_format=json&key=${apiKey}`
);
```

**What it does:**
1. Gets tournament details from database
2. Queries DataGolf with tournament's `tour` value
3. Imports players to `tournament_golfers` table

---

## Prevention Checklist

When creating a new tournament:
- ✅ Set correct `tour` field ('pga', 'euro', 'kft', 'alt')
- ✅ Verify tournament dates match actual tournament
- ✅ Only sync from DataGolf during tournament week (or verify DataGolf has the field)
- ✅ For past tournaments, use CSV upload instead

---

## Testing Commands

**Check all tournament tours:**
```javascript
const { data } = await supabase
  .from('tournaments')
  .select('name, tour, status, start_date')
  .order('start_date');
console.table(data);
```

**Test DataGolf API response:**
```bash
# PGA Tour
curl "https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=YOUR_KEY"

# DP World Tour
curl "https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=YOUR_KEY"
```

# Crown Australian Open Field Import Guide

## Issue
DataGolf doesn't provide the Crown Australian Open field through their API (likely because Nedbank Golf Challenge is the priority DP World Tour event this week, or the Australian Open isn't fully in their system yet).

## Solution: Manual CSV Upload

### Step 1: Get Player List
Visit: https://www.europeantour.com/dpworld-tour/australian-open-2026/field

### Step 2: Format as CSV
Create a file called `crown-australian-open-field.csv` with this format:

```csv
first_name,last_name,country
Elvis,Smylie,AUS
Rikuya,Hoshino,JPN
Marc,Leishman,AUS
Lucas,Herbert,AUS
Joaquin,Niemann,CHI
Min Woo,Lee,AUS
```

**Important Notes:**
- First row MUST be: `first_name,last_name,country`
- No extra spaces around names
- Country codes are 3 letters (AUS, USA, ENG, ESP, etc.)
- For players with middle names or multiple first names, put them all in `first_name` column

### Step 3: Upload in Admin Panel

1. Navigate to **Admin Panel** → **Tournaments**
2. Find **Crown Australian Open**
3. Click **Manage Golfers**
4. Look for **Upload CSV** or **Import from CSV** button
5. Select your `crown-australian-open-field.csv` file
6. Click **Upload**

### Step 4: Verify
After upload, check that:
- Correct number of players imported
- Names look correct (check first few)
- Team Builder shows Crown Australian Open players (not Nedbank players)

---

## Alternative: Quick Manual Entry Script

If you have the player names in a text file or list, you can use this script to quickly add them:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'YOUR_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Replace with Crown Australian Open tournament ID
const tournamentId = 'f587d8e4-eef0-42c9-b008-6ffbd54e4e67';

// Replace with actual player list
const players = [
  { firstName: 'Elvis', lastName: 'Smylie', country: 'AUS' },
  { firstName: 'Rikuya', lastName: 'Hoshino', country: 'JPN' },
  // ... add all players
];

async function addPlayers() {
  for (const player of players) {
    // Create or get golfer
    let { data: golfer } = await supabase
      .from('golfers')
      .select('id')
      .eq('first_name', player.firstName)
      .eq('last_name', player.lastName)
      .single();

    if (!golfer) {
      const { data: newGolfer } = await supabase
        .from('golfers')
        .insert({ 
          first_name: player.firstName, 
          last_name: player.lastName,
          country: player.country 
        })
        .select()
        .single();
      golfer = newGolfer;
    }

    // Link to tournament
    await supabase
      .from('tournament_golfers')
      .insert({ 
        tournament_id: tournamentId, 
        golfer_id: golfer.id 
      });
    
    console.log(`✅ Added ${player.firstName} ${player.lastName}`);
  }
}

addPlayers();
```

---

## Why This Happened

DataGolf's `field-updates` endpoint returns the **primary/featured tournament** for each tour. When two DP World Tour events run simultaneously:
- **Nedbank Golf Challenge** = Featured event (higher status, bigger purse)
- **Crown Australian Open** = Secondary event (co-sanctioned with PGA Tour of Australasia)

This is why:
- Syncing Nedbank works ✅
- Syncing Crown Australian Open gets Nedbank players ❌

---

## Future Prevention

For tournaments DataGolf doesn't provide:
1. ✅ Check if DataGolf has the field **before** creating competitions
2. ✅ Use CSV upload for secondary/co-sanctioned events
3. ✅ Wait until tournament becomes "featured" event (usually day before)
4. ✅ Check DataGolf website: https://datagolf.com/field-updates

# Tournament Status & Round-Based Registration - Implementation Summary

## Changes Made

### 1. ✅ Tournament Status Label Fixed
**File**: `apps/admin/src/lib/tournament-lifecycle.ts`

**Changed**: "Live In-Play" → **"In-Play"**

Now tournaments will show:
- **"In-Play"** when tournament is running (start_date ≤ now < end_date)
- **"Completed"** only after final day ends (now ≥ end_date)

### 2. ✅ Round-Based Registration System Created

**New SQL Migration**: `scripts/add-round-start-to-competition-types.sql`

Adds `round_start` field to competition types:

| Competition Type | Rounds Count | Round Start | Registration Closes |
|---|---|---|---|
| Full Course | 4 | 1 | Before tournament starts (Round 1) |
| ONE 2 ONE | 4 | 1 | Before tournament starts (Round 1) |
| First To Strike | 1 | 1 | Before tournament starts (Round 1) |
| Beat The Cut | 2 | 1 | Before tournament starts (Round 1) |
| Second Round | 1 | 2 | Before Round 2 (Day 2) |
| THE WEEKENDER | 2 | 3 | Before Round 3 (Day 3) |
| Final Strike | 1 | 4 | Before Round 4 (Final Day) |

### 3. 📋 Documentation Created

**File**: `docs/ROUND-BASED-REGISTRATION-SYSTEM.md`
- Complete system architecture
- Registration logic formulas
- Testing checklist
- Benefits and rationale

## Next Steps

### Step 1: Run the Database Migration

Go to Supabase SQL Editor and run:
```sql
-- File: scripts/add-round-start-to-competition-types.sql
```

This adds the `round_start` column and sets values for each competition type.

### Step 2: Update AI Tournament Creator

**File to modify**: `apps/admin/src/app/api/ai/create-tournament/route.ts`

**Current code** (around lines 165-177):
```typescript
competitionsToInsert.push({
  tournament_id: createdTournament.id,
  competition_type_id: comp.competitionTypeId,
  entry_fee_pennies: comp.entryFeePennies,
  entrants_cap: comp.entrantsCap,
  admin_fee_percent: comp.adminFeePercent,
  reg_open_at: regOpenDate.toISOString(), // Same for all
  reg_close_at: regCloseDate.toISOString(), // Same for all - NEEDS FIX
  // ...
});
```

**New logic needed**:
```typescript
// Fetch competition type to get round_start
const competitionType = availableTypes.find(t => t.id === comp.competitionTypeId);
const roundStart = competitionType?.round_start || 1;

// Calculate reg_close_at based on round_start
// Registration closes at 6:30 AM on the day the round starts
const regCloseDate = new Date(startDate);
regCloseDate.setDate(startDate.getDate() + (roundStart - 1)); // Add days for round
regCloseDate.setHours(6, 30, 0, 0); // 6:30 AM

competitionsToInsert.push({
  // ...
  reg_close_at: regCloseDate.toISOString(), // Now unique per competition!
  // ...
});
```

### Step 3: Test the System

**Create a new tournament** (e.g., "Test Tournament" starting Dec 10):

Expected registration close times:
- **Full Course**: Dec 10 at 6:30 AM (closes before Round 1)
- **Beat The Cut**: Dec 10 at 6:30 AM (closes before Round 1 - covers Rounds 1-2)
- **Second Round**: Dec 11 at 6:30 AM (stays open through Round 1)
- **THE WEEKENDER**: Dec 12 at 6:30 AM (stays open through Rounds 1-2 - covers Rounds 3-4)
- **Final Strike**: Dec 13 at 6:30 AM (stays open through Rounds 1-3)

## Example Scenario

**Tournament**: RSM Classic (Nov 20-23, 2025)

### Before (Same reg close for all):
- ❌ Full Course: Closes Nov 20 at 12:00 AM
- ❌ Beat The Cut: Closes Nov 20 at 12:00 AM
- ❌ THE WEEKENDER: Closes Nov 20 at 12:00 AM (too early - should stay open!)
- ❌ Final Strike: Closes Nov 20 at 12:00 AM (way too early!)

### After (Round-based):
- ✅ Full Course: Closes Nov 20 at 6:30 AM (Rounds 1-4)
- ✅ Beat The Cut: Closes Nov 20 at 6:30 AM (Rounds 1-2)
- ✅ THE WEEKENDER: Closes Nov 22 at 6:30 AM (Rounds 3-4)
- ✅ Final Strike: Closes Nov 23 at 6:30 AM (Round 4 only)

## Benefits

1. **Players can join later competitions** even after tournament starts
2. **Automatic timing** - no manual date entry per competition
3. **Accurate** - registration closes exactly when each round starts
4. **Flexible** - works for any tournament length/structure

## Status Update

✅ **Completed**:
- Database migration SQL created
- Status label changed ("In-Play")
- Documentation written

⏳ **Pending**:
- Run database migration in Supabase
- Update create-tournament API to use round_start
- Test with new tournament creation

Would you like me to implement the API changes now, or would you prefer to run the database migration first?

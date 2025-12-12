# 🔄 Tournament Lifecycle + AI Creator Integration

## Overview

The Tournament Lifecycle Manager works seamlessly with the AI Tournament Creator that fetches data from DataGolf. This document explains how they work together and how tournament data flows through the system.

## ⚠️ CRITICAL REQUIREMENT

**Initial Tournament Registration MUST NOT open until:**
1. ✅ Golfers are synced from DataGolf
2. ✅ Competitions are created
3. ✅ Everything is verified and ready

**Why?** Without golfers in the system, users cannot build their teams in the team builder. Opening registration without golfers would create a broken experience where users try to create entries but have no golfers to select.

**The 7-day rule is REMOVED.** Registration windows should ONLY be set programmatically or manually AFTER confirming golfers and competitions are ready.

### Two Registration Systems

**1. Initial Tournament Registration (InPlay, Full Tournament)**
- Opens: When golfers and competitions are ready
- Closes: Before tournament starts (e.g., 1 hour before first tee)
- Controlled by: `registration_opens_at` and `registration_closes_at`
- Status: Tournament must be `registration_open`

**2. ONE 2 ONE Challenge Registration (Dynamic, Per-Round)**
- Opens: 15 minutes before tee-off time for each round
- Available: Rounds 2, 3, and 4 only
- Closes: When round starts (at tee-off time)
- Controlled by: Per-competition logic, NOT lifecycle manager
- Status: Operates independently while tournament is `in_progress`

**Note**: When tournament status changes to `in_progress`, INITIAL registration closes, but ONE 2 ONE registration continues to operate on its own schedule throughout the tournament.

## Data Flow

```
DataGolf API
    ↓
AI Tournament Creator
    ↓
tournaments table (Supabase)
    ↓
Lifecycle Manager (Auto-transitions + Manual control)
    ↓
User-facing Golf App
```

## Integration Points

### 1. Tournament Creation (AI Creator → Lifecycle Manager)

When the AI Creator creates a tournament from DataGolf, it should set:

#### Required Fields
- `name` - Tournament name from DataGolf
- `slug` - URL-friendly version
- `start_date` - Tournament start (from DataGolf)
- `end_date` - Tournament end (from DataGolf)
- `timezone` - Tournament location timezone
- `status` - **Start with: `'upcoming'`**

#### Recommended Defaults for Lifecycle
```typescript
{
  // DO NOT set registration_opens_at initially - wait until golfers are synced
  registration_opens_at: null,
  
  // DO NOT set registration_closes_at initially
  registration_closes_at: null,
  
  // Initial status - always start here
  status: 'upcoming'
}
```

**IMPORTANT**: Registration windows should ONLY be set AFTER:
1. ✅ Golfers are synced from DataGolf
2. ✅ Competitions are created
3. ✅ Everything is ready for users to build teams

Without golfers, users cannot build teams, so registration must remain closed.

#### Example SQL Insert
```sql
-- Step 1: Create tournament WITHOUT registration windows
INSERT INTO tournaments (
  name, slug, start_date, end_date, timezone, status,
  registration_opens_at, registration_closes_at
) VALUES (
  'BMW Australian Open',
  'bmw-australian-open',
  '2024-12-14 00:00:00+00',
  '2024-12-17 23:59:59+00',
  'Australia/Melbourne',
  'upcoming',
  NULL,  -- Don't set yet - wait for golfers
  NULL   -- Don't set yet - wait for golfers
);

-- Step 2: After syncing golfers and creating competitions, set registration
UPDATE tournaments
SET 
  registration_opens_at = NOW(),  -- Open immediately, or schedule for future
  registration_closes_at = start_date - INTERVAL '1 hour'
WHERE id = 'tournament-id-here'
  AND EXISTS (SELECT 1 FROM tournament_golfers WHERE tournament_id = tournaments.id)
  AND EXISTS (SELECT 1 FROM tournament_competitions WHERE tournament_id = tournaments.id);
```

### 2. Golfer Sync (DataGolf → tournament_golfers)

After creating tournament, the AI Creator should:

1. **Fetch field from DataGolf**: Get all golfers in the tournament
2. **Fetch OWGR rankings**: Get current world rankings for salary calculation
3. **Insert into tournament_golfers**:
   ```sql
   INSERT INTO tournament_golfers (tournament_id, golfer_id, status)
   SELECT 
     :tournament_id,
     g.id,
     'confirmed'
   FROM golfers g
   WHERE g.datagolf_id IN (:datagolf_player_ids);
   ```

### 3. Competition Creation (After Golfer Sync)

Once golfers are synced:

1. **Create golfer groups** (if using restricted InPlay competitions)
2. **Create tournament_competitions** (InPlay, ONE 2 ONE, etc.)
3. **Assign golfer groups** to competitions

## Automated Lifecycle Transitions

Once tournament is created with proper timestamps, the Lifecycle Manager handles:

### Timeline Example

```
Dec 7, 2024 10:00 (UTC) - Tournament Created
│
├─── 🏗️ AI: Tournament Created
│    └── Status: upcoming
│    └── registration_opens_at: NULL (not set yet)
│    └── registration_closes_at: NULL (not set yet)
│
Dec 7, 2024 10:05 (UTC) - Golfers Synced
│
├─── ⛳ AI: 156 Golfers Synced from DataGolf
│    └── tournament_golfers table populated
│    └── OWGR rankings fetched for salaries
│
Dec 7, 2024 10:10 (UTC) - Competitions Created
│
├─── 🎯 AI: 8 Competitions Created
│    └── InPlay competitions with golfer groups
│    └── Ready for user entries
│
Dec 7, 2024 10:15 (UTC) - Registration Window Set
│
├─── 📝 AI/ADMIN: Registration Window Configured
│    └── registration_opens_at: NOW (or future date)
│    └── registration_closes_at: Dec 14, 06:00 UTC
│    └── Validated: ✅ Golfers exist, ✅ Competitions exist
│
Dec 7, 2024 10:15 (UTC) - Registration Opens (if set to NOW)
│
├─── 📝 AUTO: Registration Opens
│    └── Status: upcoming → registration_open
│    └── Users can now build teams
│
Dec 14, 2024 06:00 (UTC)
│
├─── 🔒 AUTO: Initial Registration Closes
│    └── No new full-tournament entries allowed
│    └── Existing entries locked
│    └── ONE 2 ONE registration NOT affected (continues during tournament)
│
Dec 14, 2024 07:00 (UTC)
│
├─── 🏌️ AUTO: Tournament Starts
│    └── Status: → in_progress
│    └── Live scoring begins
│    └── DataGolf score sync activates
│    └── ONE 2 ONE registration opens 15min before each round (R2, R3, R4)
│
Dec 15, 2024 06:45 (UTC) - Example: Round 2 Tee Time is 07:00
│
├─── 🎯 ONE 2 ONE: Round 2 Registration Opens
│    └── Users can create ONE 2 ONE challenges for Round 2
│    └── Closes at 07:00 (tee-off)
│
Dec 16, 2024 06:45 (UTC) - Example: Round 3 Tee Time is 07:00
│
├─── 🎯 ONE 2 ONE: Round 3 Registration Opens
│    └── Users can create ONE 2 ONE challenges for Round 3
│    └── Closes at 07:00 (tee-off)
│
Dec 17, 2024 06:45 (UTC) - Example: Round 4 Tee Time is 07:00
│
├─── 🎯 ONE 2 ONE: Round 4 Registration Opens
│    └── Users can create ONE 2 ONE challenges for Round 4
│    └── Closes at 07:00 (tee-off)
│
Dec 17, 2024 23:59 (UTC)
│
├─── 🏁 MANUAL: Tournament Completes
│    └── Admin clicks "Change Status" → completed
│    └── Final leaderboard locked
│    └── Prizes/points finalized
```

## Dashboard Views

### Active Tournaments (Top Section)
Shows tournaments with status:
- `in_progress` - Currently playing
- `registration_open` - Accepting entries
- `upcoming` - Not yet open for registration

**Sorted by**: Soonest start date first

### Completed Tournaments (Bottom Section)
Shows tournaments with status:
- `completed` - Finished normally
- `cancelled` - Cancelled/abandoned

**Sorted by**: Most recent end date first

## AI Creator Responsibilities

### What AI Creator MUST Do
1. ✅ Create tournament record with correct dates and timezone
2. ✅ Set initial status to `'upcoming'`
3. ✅ Leave registration windows as NULL initially
4. ✅ Sync golfers from DataGolf field
5. ✅ Create competitions after golfers are loaded
6. ✅ Set up golfer groups for InPlay competitions
7. ✅ Set registration windows ONLY after golfers and competitions are ready

### What AI Creator SHOULD Do
1. 📝 Validate DataGolf data before creating tournament
2. 📝 Handle timezone conversions correctly (DataGolf → Supabase)
3. 📝 Check for duplicate tournaments (same name/date)
4. 📝 Log creation events for debugging
5. 📝 Verify golfers exist before setting registration times

### What AI Creator Should NOT Do
1. ❌ Manually change status after creation (let lifecycle handle it)
2. ❌ Set status to `registration_open` immediately
3. ❌ Set registration_opens_at before golfers are synced
4. ❌ Create tournaments without proper timezone
5. ❌ Skip golfer validation before opening registration
5. ❌ Skip golfer sync step

## Lifecycle Manager Responsibilities

### What Lifecycle Manager DOES
1. ✅ Automatically transition tournament status based on timestamps
2. ✅ Validate prerequisites before transitions
3. ✅ Display countdowns and timezone-aware clocks
4. ✅ Provide manual override controls
5. ✅ Log all status changes
6. ✅ Show warnings for missing golfers/competitions
7. ✅ Manage INITIAL tournament registration windows only

### What Lifecycle Manager Does NOT Do
1. ❌ Create tournaments
2. ❌ Sync golfers from DataGolf
3. ❌ Create competitions
4. ❌ Modify tournament dates
5. ❌ Handle scoring/leaderboard updates
6. ❌ Manage ONE 2 ONE registration windows (handled by competition logic)

## Recommended Workflow

### Step 1: AI Creates Tournament (Registration CLOSED)
```typescript
// AI Tournament Creator
const tournament = await createTournamentFromDataGolf({
  datagolfEventId: '12345',
  // DO NOT set registration times yet - wait for golfers
  status: 'upcoming'
});
```

### Step 2: AI Syncs Golfers
```typescript
const field = await fetchDataGolfField(tournament.datagolf_event_id);
await syncGolfersToTournament(tournament.id, field);
```

### Step 3: AI Creates Competitions
```typescript
await createInPlayCompetitions(tournament.id, {
  competitionCount: 8,
  useGolferGroups: true
});
```

### Step 4: Set Registration Windows (NOW it's safe)
```typescript
// After golfers and competitions are ready, set INITIAL registration times
await updateTournamentRegistration(tournament.id, {
  registration_opens_at: new Date(), // Open now, or schedule for later
  registration_closes_at: new Date(tournament.start_date - 1 * 60 * 60 * 1000) // 1 hour before start
});

// Note: ONE 2 ONE registration windows are handled separately
// They open automatically 15min before tee-off for rounds 2, 3, 4
```

### Step 5: Lifecycle Takes Over
- Countdown timers appear on dashboard
- Status transitions happen automatically
- Admins can monitor/override as needed

## Configuration Options

### Environment Variables
```env
# Tournament Creation Defaults
DEFAULT_TIMEZONE=UTC
DEFAULT_REGISTRATION_CLOSE_HOURS_BEFORE_START=1  # Close 1 hour before tournament

# Lifecycle Manager
AUTO_TRANSITION_ENABLED=true
AUTO_TRANSITION_INTERVAL=5m
CRON_SECRET_TOKEN=your_secret_token
```

### Tournament-Specific Overrides

For special tournaments, AI Creator can override defaults:

```typescript
const specialTournament = await createTournament({
  // ...tournament data
  registration_opens_at: customDate,  // Override default
  registration_closes_at: customDate, // Override default
  auto_transition_enabled: false      // Disable automation if needed
});
```

## Monitoring & Debugging

### Check Tournament Status
```sql
SELECT 
  name,
  status,
  start_date,
  registration_opens_at,
  registration_closes_at,
  golfer_count,
  competition_count
FROM tournaments
WHERE start_date >= NOW()
ORDER BY start_date;
```

### Check Auto-Transition Logs
```powershell
Get-Content .\scripts\auto-transition.log -Tail 50
```

### Manual Status Override
If automation fails or needs override:
1. Visit http://localhost:3003/tournament-lifecycle
2. Click tournament card "Change Status" button
3. Select desired status
4. Confirm change

## Error Handling

### Common Issues

#### 1. Tournament Created Without Golfers
**Symptom**: Registration can't open automatically
**Solution**: AI Creator must sync golfers before registration window

#### 2. Registration Opens Without Competitions
**Symptom**: Users can't create entries
**Solution**: AI Creator must create competitions after golfers synced

#### 3. Wrong Timezone
**Symptom**: Countdown timers show incorrect time
**Solution**: Verify tournament.timezone matches location (use IANA format)

#### 4. Auto-Transition Not Working
**Symptom**: Status doesn't change automatically
**Solution**: Check Task Scheduler job is running, admin app on port 3003

## ONE 2 ONE Registration System

The ONE 2 ONE challenges use a separate, dynamic registration system that operates DURING the tournament.

### How ONE 2 ONE Registration Works

**Key Differences from Initial Registration:**
- ✅ Opens dynamically per round (not fixed tournament-wide window)
- ✅ Available for Rounds 2, 3, and 4 only (not Round 1)
- ✅ Opens 15 minutes before tee-off time
- ✅ Closes at tee-off time (when round starts)
- ✅ Operates independently of tournament `status`
- ✅ NOT controlled by Lifecycle Manager

### Registration Windows Per Round

```
Round 1: NO ONE 2 ONE registration (initial entries only)

Round 2:
  Opens:  Round 2 tee time - 15 minutes
  Closes: Round 2 tee time (when play starts)
  
Round 3:
  Opens:  Round 3 tee time - 15 minutes
  Closes: Round 3 tee time (when play starts)
  
Round 4:
  Opens:  Round 4 tee time - 15 minutes
  Closes: Round 4 tee time (when play starts)
```

### Implementation Logic

```typescript
// This logic runs independently from lifecycle manager
function isOneToOneRegistrationOpen(competition: OneToOneCompetition, currentTime: Date): boolean {
  const round = competition.round_number;
  
  // ONE 2 ONE only available for rounds 2, 3, 4
  if (round < 2 || round > 4) return false;
  
  // Get tee time for this round
  const teeTime = getRoundTeeTime(competition.tournament_id, round);
  const registrationOpens = new Date(teeTime.getTime() - 15 * 60 * 1000); // 15 min before
  const registrationCloses = teeTime;
  
  return currentTime >= registrationOpens && currentTime < registrationCloses;
}
```

### User Experience Flow

1. **Tournament Starts** (status: `in_progress`)
   - Round 1 begins
   - Users play initial tournament entries
   - ONE 2 ONE not available yet

2. **Before Round 2** (15 minutes before R2 tee-off)
   - ONE 2 ONE registration opens for Round 2
   - Users can create head-to-head challenges
   - Countdown shows: "🎯 ONE 2 ONE R2: 14m 30s"

3. **Round 2 Starts** (at tee-off)
   - ONE 2 ONE Round 2 registration closes
   - Challenges locked for Round 2
   - Same pattern repeats for Rounds 3 and 4

### Data Structure

```typescript
// tournament_competitions table
{
  id: 'uuid',
  tournament_id: 'uuid',
  competition_type: 'one_2_one',
  round_number: 2,  // 2, 3, or 4
  // NO registration_opens_at or registration_closes_at here
  // Calculated dynamically from round tee times
}

// Round tee times from DataGolf
{
  tournament_id: 'uuid',
  round_number: 2,
  tee_time: '2024-12-15T07:00:00Z'  // Used to calculate 15min window
}
```

### Lifecycle Manager vs ONE 2 ONE

| Feature | Lifecycle Manager | ONE 2 ONE System |
|---------|------------------|------------------|
| Controls | Initial tournament registration | Per-round challenge registration |
| Timing | Fixed: `registration_opens_at` / `closes_at` | Dynamic: 15min before each round tee |
| Rounds | All rounds via initial entry | Rounds 2, 3, 4 only |
| Status Dependency | Must be `registration_open` | Operates during `in_progress` |
| User Facing | "Build Your Team" (pre-tournament) | "Create Challenge" (during tournament) |

## Testing Checklist

### Before Deploying AI Creator Changes
- [ ] Create test tournament with correct timestamps
- [ ] Verify golfers sync successfully
- [ ] Verify competitions created
- [ ] Check lifecycle dashboard shows tournament
- [ ] Verify countdown timer displays correctly
- [ ] Test manual status change works
- [ ] Wait for auto-transition (or trigger manually)
- [ ] Verify status changes automatically

### Integration Test Flow
1. **AI Creator**: Create tournament 30 minutes in future
2. **AI Creator**: Set registration to open in 5 minutes
3. **AI Creator**: Sync 20 test golfers
4. **AI Creator**: Create 2 competitions
5. **Lifecycle**: Watch countdown on dashboard
6. **Lifecycle**: Wait 5 minutes for auto-transition
7. **Verify**: Status changes to `registration_open`
8. **User App**: Verify users can create entries

## Best Practices

### For AI Creator Development
1. **Always set registration windows**: Don't leave null
2. **Use UTC for storage**: Convert display times in UI
3. **Validate DataGolf data**: Check for nulls/errors
4. **Log everything**: Makes debugging 100x easier
5. **Handle API failures**: DataGolf might be down

### For Lifecycle Manager Usage
1. **Monitor dashboard regularly**: Catch issues early
2. **Check auto-transition logs**: Verify automation working
3. **Manual override when needed**: Don't fight the automation
4. **Update registration windows**: If tournament date changes
5. **Complete manually**: Don't rely on auto-completion

## Future Enhancements

### Possible Improvements
1. **Webhook notifications**: Alert when status changes
2. **Slack integration**: Post updates to team channel
3. **Email reminders**: Notify admins of upcoming tournaments
4. **DataGolf sync status**: Show last sync time on dashboard
5. **Rollback functionality**: Undo status changes if needed
6. **Bulk operations**: Create multiple tournaments at once
7. **Template system**: Save common configuration patterns

## Summary

The Lifecycle Manager is designed to work **after** the AI Tournament Creator has done its job:

**AI Creator**: Creates tournament, syncs data → **Lifecycle Manager**: Automates status transitions, provides monitoring

Together, they create a fully automated, reliable tournament management system that requires minimal manual intervention.

---

**Key Principle**: AI Creator handles **data creation**, Lifecycle Manager handles **status transitions**.

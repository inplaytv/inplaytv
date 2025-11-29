# DataGolf API Integration - Comprehensive Architecture

## Current Implementation Status

### ✅ Already Working
1. **Field Updates (`sync-golfers` endpoint)**
   - Location: `/api/tournaments/[id]/sync-golfers`
   - Uses: `feeds.datagolf.com/field-updates`
   - Purpose: Sync tournament field, tee times, player IDs
   - Status: WORKING ✅

### ⚠️ Partially Implemented  
2. **Live Scoring (`sync-scores` endpoint)**
   - Location: `/api/admin/tournaments/[id]/sync-scores`
   - Uses: `feeds.datagolf.com/preds/in-play`
   - Purpose: Live tournament scores
   - Issues:
     - ❌ Doesn't use `historical-raw-data/rounds` for completed tournaments
     - ❌ Incorrect historical endpoint (`event-results` doesn't exist)
     - ❌ No field-updates integration for tee times

### ❌ Not Implemented
3. **Historical Raw Data**
   - Endpoint: `feeds.datagolf.com/historical-raw-data/rounds`
   - Purpose: Get past tournament scores
   - Status: NOT USED

4. **Live Tournament Stats**
   - Endpoint: `feeds.datagolf.com/preds/live-tournament-stats`
   - Purpose: Strokes-gained, detailed stats
   - Status: NOT USED

5. **Event List**
   - Endpoint: `feeds.datagolf.com/historical-raw-data/event-list`
   - Purpose: Get all available tournament IDs
   - Status: NOT USED

## Recommended Architecture

### Phase 1: Fix Current Scoring System (IMMEDIATE)

**Update `packages/scoring-service/src/index.ts`:**

```typescript
async fetchLiveScores(tournamentId: string, supabase: SupabaseClient) {
  const tournament = await this.getTournament(tournamentId, supabase);
  
  // Route to appropriate endpoint based on status
  if (tournament.status === 'completed') {
    return this.fetchHistoricalScores(tournament, supabase);
  } else if (tournament.status === 'live') {
    return this.fetchLiveScoresInPlay(tournament, supabase);
  } else {
    throw new Error('Tournament not started yet');
  }
}

// NEW METHOD
private async fetchHistoricalScores(tournament, supabase) {
  const year = new Date(tournament.start_date).getFullYear();
  const url = `${this.baseUrl}/historical-raw-data/rounds?tour=pga&event_id=${tournament.event_id}&year=${year}&file_format=json&key=${this.apiKey}`;
  
  const response = await this.fetchWithRetry(url);
  const rounds = await response.json(); // Array of round records
  
  // Transform: rounds[] -> playerScores[]
  return this.transformHistoricalRounds(rounds, tournament);
}

// NEW METHOD
private transformHistoricalRounds(rounds: HistoricalRound[], tournament) {
  // Group by player
  const playerMap = new Map();
  
  for (const round of rounds) {
    if (!playerMap.has(round.dg_id)) {
      playerMap.set(round.dg_id, {
        dgId: round.dg_id,
        name: round.player_name,
        rounds: {},
        position: round.position,
        totalScore: round.total_score,
        toPar: round.to_par
      });
    }
    
    const player = playerMap.get(round.dg_id);
    player.rounds[`round${round.round_num}`] = {
      score: round.round_score,
      toPar: round.round_score ? round.round_score - 72 : null,
      status: 'completed'
    };
  }
  
  return Array.from(playerMap.values());
}
```

### Phase 2: Add Tee Times Integration (ENHANCEMENT)

**Create `TournamentFieldService`:**

```typescript
// New service: packages/field-service/src/index.ts
export class FieldService {
  async updateTeeTimes(tournamentId: string, supabase: SupabaseClient) {
    // 1. Fetch from field-updates
    const fieldData = await this.fetchFieldUpdates();
    
    // 2. Update tournament_golfers with tee times
    for (const player of fieldData.field) {
      await supabase
        .from('tournament_golfers')
        .update({
          r1_tee_time: player.r1_teetime,
          r2_tee_time: player.r2_teetime,
          r3_tee_time: player.r3_teetime,
          r4_tee_time: player.r4_teetime
        })
        .match({
          tournament_id: tournamentId,
          golfer_id: /* find by dg_id */
        });
    }
  }
}
```

### Phase 3: Add Stats Dashboard (FUTURE)

**Create `/api/tournaments/[id]/stats` endpoint:**

```typescript
// Uses: feeds.datagolf.com/preds/live-tournament-stats
// Returns: strokes-gained, accuracy, distance, etc.
// Display: Admin dashboard with player performance analytics
```

## Implementation Priority

### 🔴 HIGH PRIORITY (Fix Now)
1. ✅ Fix historical scoring - use `historical-raw-data/rounds`
2. ✅ Add transformer for historical data format
3. ✅ Test with completed tournaments (RSM Classic)

### 🟡 MEDIUM PRIORITY (This Week)
4. ⚠️ Add tee times to database schema
5. ⚠️ Update field-updates sync to store tee times
6. ⚠️ Display tee times in admin UI

### 🟢 LOW PRIORITY (Future Enhancement)
7. 📊 Implement live-tournament-stats endpoint
8. 📊 Create stats dashboard in admin
9. 📊 Show strokes-gained data to users

## Database Schema Updates Needed

```sql
-- Add tee time columns to tournament_golfers
ALTER TABLE tournament_golfers 
ADD COLUMN r1_tee_time TIMESTAMPTZ,
ADD COLUMN r2_tee_time TIMESTAMPTZ,
ADD COLUMN r3_tee_time TIMESTAMPTZ,
ADD COLUMN r4_tee_time TIMESTAMPTZ;

-- Add DataGolf sync tracking
ALTER TABLE tournaments
ADD COLUMN last_field_sync TIMESTAMPTZ,
ADD COLUMN last_score_sync TIMESTAMPTZ;
```

## API Endpoint Summary

| Endpoint | Current Use | Recommended Use | Priority |
|----------|-------------|-----------------|----------|
| `field-updates` | ✅ Sync golfers | ✅ Sync golfers + tee times | HIGH |
| `preds/in-play` | ⚠️ Live scores | ✅ Live scores only | HIGH |
| `historical-raw-data/rounds` | ❌ Not used | ✅ Completed tournament scores | HIGH |
| `historical-raw-data/event-list` | ❌ Not used | ⚠️ Tournament discovery | MEDIUM |
| `live-tournament-stats` | ❌ Not used | 📊 Stats dashboard | LOW |
| `get-player-list` | ❌ Not used | ⚠️ Player database seeding | LOW |

## Immediate Action Items

1. **Update scoring service** to use correct historical endpoint
2. **Add transformer** for historical round data
3. **Test** with RSM Classic (completed tournament)
4. **Update sync-golfers** to store tee times
5. **Add migration** for tee time columns

This will give you a robust, production-ready scoring system that works for both live and completed tournaments.

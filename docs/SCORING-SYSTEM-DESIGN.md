# Tournament Scoring Management System - Design Document

## Executive Summary

This document outlines a professional, fault-tolerant scoring management system for InPlayTV that:
1. **Records all round scores** as historical backup data
2. **Works with DataGolf API** (current provider)
3. **Easy upgrade path to SportsRadar API** (future provider)
4. **Admin scorecard interface** for verification and manual overrides
5. **Frontend scorecards** for user transparency

---

## 1. DataGolf API Analysis

### Available Endpoints (Currently Using)

#### 1.1 **Field Updates** (`field-updates`)
```
GET https://feeds.datagolf.com/field-updates?tour={pga|euro|kft}&file_format=json&key={API_KEY}
```
**Provides:**
- Tournament field (list of golfers)
- Player names, DG IDs
- Tee times (r1_tee_time, r2_tee_time, r3_tee_time, r4_tee_time)
- Withdrawals (wd, wd_after_rd1, etc.)

**Update Frequency:** Daily during tournament week

#### 1.2 **In-Play Predictions** (`preds/in-play`)
```
GET https://feeds.datagolf.com/preds/in-play?tour={pga|euro}&file_format=json&key={API_KEY}
```
**Provides:**
- **LIVE scores during tournament**
- Current position
- Total score (to par)
- Today's score
- Holes through (thru)
- **Individual round scores: R1, R2, R3, R4**
- Player predictions and probabilities

**Update Frequency:** Every 5 minutes during live play

#### 1.3 **Historical Raw Data** (`historical-raw-data/event-results`)
```
GET https://feeds.datagolf.com/historical-raw-data/event-results?tour={pga|euro}&event_id={event-id}&file_format=json&key={API_KEY}
```
**Provides:**
- **Complete tournament results after completion**
- Final positions
- **All 4 round scores**
- Prize money
- FedEx Cup points
- Detailed statistics

**Update Frequency:** After tournament completion

### Current Implementation Gaps

❌ **Not storing historical scores** - Only fetching live data, no backup
❌ **No round-by-round tracking** - Not recording each round as it happens
❌ **No manual override capability** - Can't correct DataGolf errors
❌ **No scorecard view** - Can't verify scoring data
❌ **No audit trail** - No history of score changes

---

## 2. Database Schema Design

### 2.1 New Table: `tournament_round_scores`

**Purpose:** Store every golfer's score for every round as historical backup

```sql
CREATE TABLE public.tournament_round_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
  
  -- Round Information
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 4),
  
  -- Scores
  score INTEGER, -- Actual score (72, 68, 75, etc.)
  to_par INTEGER, -- Relative to par (-2, +3, E, etc.)
  par_value INTEGER DEFAULT 72, -- Par for this round (usually 72)
  
  -- Status
  status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed, withdrawn, cut
  holes_completed INTEGER DEFAULT 0, -- 0-18
  
  -- Tee Time
  tee_time TIMESTAMPTZ,
  
  -- Data Source & Quality
  data_source VARCHAR(20) DEFAULT 'datagolf', -- datagolf, sportsradar, manual
  is_official BOOLEAN DEFAULT false, -- true when round is officially complete
  is_manual_override BOOLEAN DEFAULT false, -- true if admin manually edited
  
  -- Audit Trail
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id), -- NULL for API, UUID for manual edits
  
  -- Metadata
  notes TEXT, -- Admin notes for manual overrides
  raw_api_data JSONB, -- Store complete API response for debugging
  
  -- Constraints
  UNIQUE(tournament_id, golfer_id, round_number),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_round_scores_tournament ON tournament_round_scores(tournament_id);
CREATE INDEX idx_round_scores_golfer ON tournament_round_scores(golfer_id);
CREATE INDEX idx_round_scores_round ON tournament_round_scores(tournament_id, round_number);
CREATE INDEX idx_round_scores_source ON tournament_round_scores(data_source, is_manual_override);
CREATE INDEX idx_round_scores_updated ON tournament_round_scores(updated_at DESC);

-- Comments
COMMENT ON TABLE tournament_round_scores IS 'Historical backup of every golfers score for every round - fault-tolerant scoring system';
COMMENT ON COLUMN tournament_round_scores.raw_api_data IS 'Complete API response stored as JSONB for debugging and API migration';
COMMENT ON COLUMN tournament_round_scores.is_manual_override IS 'TRUE when admin manually corrects DataGolf error';
```

### 2.2 Update Existing Table: `tournament_golfers`

**Add scoring summary columns** (denormalized for performance):

```sql
ALTER TABLE public.tournament_golfers
ADD COLUMN IF NOT EXISTS r1_score INTEGER,
ADD COLUMN IF NOT EXISTS r2_score INTEGER,
ADD COLUMN IF NOT EXISTS r3_score INTEGER,
ADD COLUMN IF NOT EXISTS r4_score INTEGER,
ADD COLUMN IF NOT EXISTS total_score INTEGER,
ADD COLUMN IF NOT EXISTS position VARCHAR(10),
ADD COLUMN IF NOT EXISTS made_cut BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_score_update TIMESTAMPTZ;

COMMENT ON COLUMN tournament_golfers.r1_score IS 'Round 1 score - denormalized from tournament_round_scores for performance';
COMMENT ON COLUMN tournament_golfers.last_score_update IS 'Last time scores were updated from API or manually';
```

---

## 3. Admin Interface Design

### 3.1 Tournament Scoring Dashboard

**Location:** `/admin/tournaments/[id]/scoring`

**Features:**
1. **Round-by-Round View**
   - Tabs: Round 1 | Round 2 | Round 3 | Round 4 | Final
   - Table showing all golfers with scores
   - Color coding:
     - 🟢 Green: Official completed scores
     - 🟡 Yellow: In progress
     - ⚪ Gray: Not started
     - 🔴 Red: Manual override applied
     - ⚫ Black: Withdrawn/Cut

2. **Data Source Indicators**
   - Badge showing: "DataGolf" or "Manual" or "SportsRadar"
   - Last updated timestamp
   - Sync status: ✅ Synced | ⏳ Syncing | ❌ Error

3. **Manual Override Capability**
   - Click any score to edit
   - Modal opens with:
     - Current score (from API)
     - Manual input field
     - Reason/notes field (required)
     - "Save Override" button
   - Shows warning: "⚠️ This will override DataGolf data"

4. **Bulk Actions**
   - "Sync All Rounds" button - Fetches latest from DataGolf
   - "Mark Round as Official" - Locks round, prevents auto-updates
   - "Export Scorecard (PDF)" - Generates official scorecard
   - "View Audit Log" - Shows all score changes

5. **Score Verification Tools**
   - Compare with external source (link to PGA.com)
   - Flag discrepancies automatically
   - Show confidence score (when using predictions)

### 3.2 Scorecard View

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  2025 BMW Australian PGA Championship - Round 2             │
│  Last Updated: Nov 28, 2025 14:32 AEST (DataGolf)          │
├─────────────────────────────────────────────────────────────┤
│ Pos │ Player         │ R1  │ R2  │ R3  │ R4  │ Total │ Thru│
├─────┼────────────────┼─────┼─────┼─────┼─────┼───────┼─────┤
│ 1   │ Rory McIlroy   │ 65  │ 68  │ -   │ -   │ -5    │ F   │
│ 2   │ Jon Rahm       │ 67  │ 67  │ -   │ -   │ -4    │ F   │
│ T3  │ Scottie Scheffler│ 68 │ 67  │ -   │ -   │ -3    │ F   │
│ T3  │ Viktor Hovland │ 66  │ 69  │ -   │ -   │ -3    │ F   │
└─────┴────────────────┴─────┴─────┴─────┴─────┴───────┴─────┘

[Edit Score] [Sync Now] [Export PDF] [View Details]
```

### 3.3 Audit Log View

**Shows complete history:**
```
┌────────────────────────────────────────────────────────────┐
│ Score Change History - Rory McIlroy - Round 2             │
├────────────────────────────────────────────────────────────┤
│ Nov 28 14:30 │ Score: 68 │ DataGolf Auto-Sync            │
│ Nov 28 13:15 │ Score: 67 → 68 │ Manual Override by Admin  │
│              │ Reason: "DataGolf showed 67, PGA.com"     │
│              │ "shows 68 official"                        │
│ Nov 28 12:00 │ Score: 67 │ DataGolf In-Play Update       │
│ Nov 28 10:45 │ Score: -  │ Round Started                 │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Scoring Sync Service

### 4.1 Automated Sync Process

**New API Endpoint:** `POST /api/admin/tournaments/[id]/sync-scores`

**Logic:**
```typescript
async function syncTournamentScores(tournamentId: string) {
  // 1. Get tournament and golfers
  const tournament = await getTournament(tournamentId);
  const golfers = await getTournamentGolfers(tournamentId);
  
  // 2. Determine current round (based on dates/status)
  const currentRound = determineCurrentRound(tournament);
  
  // 3. Fetch scores from DataGolf
  const liveScores = await fetchDataGolfScores(tournament);
  
  // 4. For each golfer, update/insert round scores
  for (const golferScore of liveScores) {
    for (let round = 1; round <= 4; round++) {
      const roundScore = golferScore[`R${round}`];
      
      if (roundScore !== null && roundScore !== undefined) {
        await upsertRoundScore({
          tournament_id: tournamentId,
          golfer_id: golferScore.golfer_id,
          round_number: round,
          score: roundScore,
          to_par: roundScore - 72, // Calculate to par
          data_source: 'datagolf',
          is_official: round < currentRound, // Previous rounds are official
          raw_api_data: golferScore, // Store complete response
          fetched_at: new Date()
        });
      }
    }
  }
  
  // 5. Update denormalized scores in tournament_golfers
  await updateDenormalizedScores(tournamentId);
  
  // 6. Recalculate fantasy points if needed
  await recalculateFantasyPoints(tournamentId);
}
```

**Cron Schedule:**
- **During tournament:** Every 5 minutes (matches DataGolf update frequency)
- **After tournament:** Once per hour for 24 hours (catch final adjustments)
- **Completed:** Daily for 7 days (catch any corrections)

### 4.2 Error Handling & Retry Logic

```typescript
// Exponential backoff for API failures
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

async function fetchWithRetry(url: string, attempt = 0): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAYS[attempt]);
      return fetchWithRetry(url, attempt + 1);
    }
    
    // Log error and alert admin
    await logScoringError({
      tournament_id: tournamentId,
      error: error.message,
      severity: 'high',
      needs_manual_review: true
    });
    
    throw error;
  }
}
```

---

## 5. API Migration Strategy (DataGolf → SportsRadar)

### 5.1 Adapter Pattern

**Create scoring adapter interface:**

```typescript
// lib/scoring/ScoringAdapter.ts
interface TournamentScore {
  golfer_id: string;
  golfer_name: string;
  rounds: {
    round1: number | null;
    round2: number | null;
    round3: number | null;
    round4: number | null;
  };
  position: string;
  total_score: number;
  thru: string | number;
}

interface ScoringAdapter {
  fetchLiveScores(tournamentId: string): Promise<TournamentScore[]>;
  fetchHistoricalScores(tournamentId: string): Promise<TournamentScore[]>;
  getProviderName(): string;
}

// lib/scoring/DataGolfAdapter.ts
class DataGolfAdapter implements ScoringAdapter {
  async fetchLiveScores(tournamentId: string): Promise<TournamentScore[]> {
    // Current DataGolf implementation
    const response = await fetch(`https://feeds.datagolf.com/preds/in-play?...`);
    const data = await response.json();
    
    // Transform to standardized format
    return data.data.map(golfer => ({
      golfer_id: golfer.dg_id,
      golfer_name: golfer.player_name,
      rounds: {
        round1: golfer.R1 || null,
        round2: golfer.R2 || null,
        round3: golfer.R3 || null,
        round4: golfer.R4 || null,
      },
      position: golfer.position || golfer.current_pos,
      total_score: golfer.total_score,
      thru: golfer.thru
    }));
  }
  
  getProviderName(): string {
    return 'datagolf';
  }
}

// lib/scoring/SportsRadarAdapter.ts (Future)
class SportsRadarAdapter implements ScoringAdapter {
  async fetchLiveScores(tournamentId: string): Promise<TournamentScore[]> {
    // SportsRadar implementation - same interface, different API
    const response = await fetch(`https://api.sportradar.com/golf/...`);
    const data = await response.json();
    
    // Transform SportsRadar format to our standard format
    return transformSportsRadarData(data);
  }
  
  getProviderName(): string {
    return 'sportsradar';
  }
}

// lib/scoring/ScoringService.ts
class ScoringService {
  private adapter: ScoringAdapter;
  
  constructor() {
    // Switch provider via environment variable
    const provider = process.env.SCORING_PROVIDER || 'datagolf';
    
    switch (provider) {
      case 'sportsradar':
        this.adapter = new SportsRadarAdapter();
        break;
      case 'datagolf':
      default:
        this.adapter = new DataGolfAdapter();
        break;
    }
  }
  
  async syncScores(tournamentId: string) {
    const scores = await this.adapter.fetchLiveScores(tournamentId);
    await this.saveScoresToDatabase(scores);
  }
}
```

**Migration becomes:** Change `SCORING_PROVIDER=sportsradar` in .env

---

## 6. Frontend Scorecard Display

### 6.1 Golf App Scorecard

**Location:** `/tournaments/[slug]/scorecard` or `/leaderboards/[slug]/scorecard`

**Features:**
- Real-time updates (polling every 30 seconds during live play)
- Round-by-round breakdown
- Hole-by-hole scorecard (if API provides)
- Player comparison
- Mobile-responsive design

**Example Component:**
```tsx
// components/TournamentScorecard.tsx
export function TournamentScorecard({ tournamentId }: { tournamentId: string }) {
  const [scores, setScores] = useState<TournamentScore[]>([]);
  const [selectedRound, setSelectedRound] = useState<number>(2);
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScores();
    }, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);
  
  return (
    <div className="scorecard">
      <div className="round-tabs">
        {[1, 2, 3, 4].map(round => (
          <button 
            key={round}
            onClick={() => setSelectedRound(round)}
            className={selectedRound === round ? 'active' : ''}
          >
            Round {round}
          </button>
        ))}
      </div>
      
      <table className="scores-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Player</th>
            <th>Score</th>
            <th>Thru</th>
          </tr>
        </thead>
        <tbody>
          {scores.map(score => (
            <tr key={score.golfer_id}>
              <td>{score.position}</td>
              <td>{score.golfer_name}</td>
              <td className={score.rounds[`round${selectedRound}`] < 72 ? 'under-par' : ''}>
                {score.rounds[`round${selectedRound}`] || '-'}
              </td>
              <td>{score.thru}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="last-updated">
        Last updated: {lastUpdateTime} (DataGolf)
      </div>
    </div>
  );
}
```

---

## 7. Implementation Phases

### Phase 1: Database & Core API (Week 1)
- [ ] Create `tournament_round_scores` table
- [ ] Update `tournament_golfers` with score columns
- [ ] Create scoring sync API endpoint
- [ ] Implement DataGolfAdapter
- [ ] Set up cron job for auto-sync

### Phase 2: Admin Interface (Week 2)
- [ ] Build Tournament Scoring Dashboard
- [ ] Implement manual override UI
- [ ] Create scorecard view
- [ ] Add audit log viewer
- [ ] Build bulk sync actions

### Phase 3: Frontend Display (Week 3)
- [ ] Create TournamentScorecard component
- [ ] Add to leaderboards page
- [ ] Implement auto-refresh
- [ ] Mobile optimization
- [ ] Add loading states & error handling

### Phase 4: Polish & Testing (Week 4)
- [ ] Comprehensive testing
- [ ] Error notification system
- [ ] Performance optimization
- [ ] Documentation
- [ ] Admin training

---

## 8. Benefits Summary

✅ **Fault Tolerance:** All scores backed up, can survive API outages
✅ **Audit Trail:** Complete history of all score changes
✅ **Manual Override:** Admin can correct API errors immediately
✅ **Easy Migration:** Adapter pattern allows API swap without code changes
✅ **Professional:** Scorecard views provide transparency and verification
✅ **Scalable:** Efficient queries, denormalized data for performance
✅ **Reliable:** Exponential backoff, retry logic, error logging

---

## 9. Questions & Decisions Needed

1. **Manual Override Authority:** Who can manually override scores? (Super admin only? Tournament managers?)

2. **Score Locking:** Should completed rounds be locked from auto-updates?

3. **Notification System:** Email/Slack alerts when scores can't be synced?

4. **Historical Data:** Import past tournament scores from DataGolf for existing tournaments?

5. **Cut Line:** Should system automatically detect cut line and mark players?

6. **Hole-by-Hole:** Do we want hole-by-hole scoring (requires additional API endpoints)?

7. **Performance:** Keep how many days of audit history? Archive old data?

8. **Budget:** SportsRadar is more expensive - what's the trigger for upgrade?

---

**Next Steps:** Review this document and answer the questions above. Then I'll begin implementation starting with Phase 1.

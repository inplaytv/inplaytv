# DataGolf API - Complete Implementation Guide

**API Key:** `ac7793fb5f617626ccc418008832`  
**Subscription:** Scratch Plus (120 requests/minute)  
**Documentation:** https://datagolf.com/api-access

---

## 🎯 CURRENTLY IMPLEMENTED

### ✅ Field Updates
**Endpoint:** `/field-updates?tour={tour}&file_format=json&key={api_key}`  
**Purpose:** Get tournament field lists, tee times, and player info  
**Status:** ✅ IMPLEMENTED in sync-golfers route  
**Use Cases:**
- Sync tournament golfers
- Get tee times for rounds
- Player salaries (if available)
- Tournament field announcements

**Tours Supported:**
- `pga` - PGA Tour
- `euro` - DP World Tour (European Tour)
- `kft` - Korn Ferry Tour
- `alt` - LIV Golf
- `opp` - Opposite field PGA events

---

### ✅ Live Tournament Stats
**Endpoint:** `/preds/live-tournament-stats?tour={tour}&file_format=json&key={api_key}`  
**Purpose:** Live scoring and stats for in-progress tournaments  
**Status:** ✅ IMPLEMENTED as fallback in sync-golfers route  
**Use Cases:**
- Live leaderboard data
- Current scores
- Player performance metrics
- In-progress tournament fields

**Data Includes:**
- `player_name`
- `dg_id`
- `country`
- `total_score` - Current tournament score
- `thru` - Holes completed in current round
- `today` - Today's score
- `r1`, `r2`, `r3`, `r4` - Round scores
- `sg_total` - Strokes gained total
- `sg_ott`, `sg_app`, `sg_arg`, `sg_putt` - Strokes gained breakdown

---

## 🚀 RECOMMENDED TO IMPLEMENT

### 🏆 Live Hole Scoring Distributions [NEW]
**Endpoint:** `/preds/live-hole-stats?tour={tour}&file_format=json&key={api_key}`  
**Purpose:** Hole-by-hole scoring statistics and distributions  
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🔥 HIGH - Perfect for live competition features

**What You Get:**
```json
{
  "event_name": "BMW Australian PGA Championship",
  "last_update": "2025-11-29 3:05 PM",
  "current_round": 4,
  "courses": [{
    "course_code": "RC",
    "rounds": [{
      "round_num": 4,
      "holes": [{
        "hole": 1,
        "par": 4,
        "yardage": 438,
        "total": {
          "avg_score": 4.212,
          "players_thru": 156,
          "eagles_or_better": 0,
          "birdies": 19,
          "pars": 89,
          "bogeys": 44,
          "doubles_or_worse": 4
        },
        "morning_wave": { /* Same structure */ },
        "afternoon_wave": { /* Same structure */ }
      }]
    }]
  }]
}
```

**Use Cases for Your Platform:**
- **Real-time hole difficulty indicators** - Show which holes are playing tough
- **Live scoring trends** - Display birdie/eagle opportunities
- **Wave-specific stats** - Morning vs afternoon scoring
- **Competition insights** - Help users pick teams based on live conditions
- **Broadcast-style graphics** - "Hole X is playing 0.5 strokes over par today"
- **Player performance prediction** - Expected scores on remaining holes

**Implementation Ideas:**
1. **Live Difficulty Overlay:** Show heat map of course difficulty in real-time
2. **Smart Pick Suggestions:** "Hole 17 is playing easy - players with approach game strength!"
3. **Momentum Tracking:** Which holes are trending easier/harder as conditions change
4. **Competition Strategy:** Help users understand which players have favorable holes remaining

---

### 📊 Pre-Tournament Predictions
**Endpoint:** `/preds/pre-tournament?tour={tour}&file_format=json&key={api_key}`  
**Purpose:** Win probabilities and predictions before tournament starts  
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🔥 HIGH - Great for team builder

**What You Get:**
- Player win probabilities
- Top 5/10/20 finish probabilities
- Make/miss cut predictions
- Baseline odds vs actual odds

**Use Cases:**
- Auto-suggest team compositions
- Player rankings in team builder
- Salary vs value analysis
- Competition difficulty indicators

---

### 🎯 Player Skill Decompositions
**Endpoint:** `/preds/skill-decompositions?file_format=json&key={api_key}`  
**Purpose:** Detailed skill ratings for all players  
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🔥 HIGH - Essential for team building

**What You Get:**
```json
{
  "baseline_history_fit": [
    {
      "dg_id": 15856,
      "player_name": "Cameron Smith",
      "primary_tour": "alt",
      "country": "AUS",
      "dg_skill_estimate": 1.85,
      "driving_acc": 0.12,
      "driving_dist": 0.45,
      "approach": 0.98,
      "short_game": 0.31,
      "putting": -0.01,
      "sg_total": 1.85
    }
  ]
}
```

**Use Cases:**
- **Smart Filters:** "Show me players strong in approach shots"
- **Team Balance:** Ensure well-rounded team composition
- **Course Fit Analysis:** Match player strengths to course characteristics
- **Golfer Profiles:** Rich player cards with skill breakdowns
- **Comparison Tools:** Compare two players side-by-side

---

### 📈 Historical Performance
**Endpoint:** `/historical-dg-rankings?file_format=json&key={api_key}`  
**Purpose:** Historical skill ratings over time  
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🟡 MEDIUM

**Use Cases:**
- Player form trends
- Hot streak detection
- Historical performance graphs
- Season progression tracking

---

### 🏌️ Tour Schedules
**Endpoint:** `/preds/get-schedule?tour={tour}&file_format=json&key={api_key}`  
**Purpose:** Complete tournament schedules  
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🟢 LOW (AI creates tournaments)

---

### 💰 Betting Odds & Lines
**Endpoint:** `/betting-tools/outrights?tour={tour}&market={market}&file_format=json&key={api_key}`  
**Purpose:** Win odds, matchups, and betting markets  
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🟡 MEDIUM

**Markets Available:**
- `win` - Outright win odds
- `make_cut`
- `top_5`, `top_10`, `top_20`
- `matchups` - Head-to-head matchups
- `3balls` - Three-ball matchups

**Use Cases:**
- Odds-based salaries
- Value picks identification
- Market-implied probabilities

---

### 📅 Detailed Schedule Data
**Endpoint:** `/get-schedule?tour={tour}&file_format=json&key={api_key}`  
**Purpose:** Tournament details, dates, courses  
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🟢 LOW

---

## 🎮 LIVE SCORING IMPLEMENTATION PLAN

### Phase 1: Real-Time Leaderboard (IMMEDIATE)
**Use:** `live-tournament-stats` endpoint (already have fallback)

**Features to Build:**
1. **Live Scores Table**
   ```typescript
   // Poll every 60 seconds during tournament
   const liveScores = await fetch(
     `https://feeds.datagolf.com/preds/live-tournament-stats?tour=euro&key=${apiKey}`
   );
   ```

2. **Score Updates**
   - Store in `tournament_golfers` table
   - Add columns: `current_score`, `current_round`, `thru`, `today_score`
   - Update every minute during live rounds

3. **Team Score Calculation**
   - Sum scores from selected golfers
   - Real-time leaderboard for all competition entries
   - Live rankings updates

### Phase 2: Hole-by-Hole Stats (RECOMMENDED)
**Use:** `live-hole-stats` endpoint

**Features to Build:**
1. **Course Difficulty Heatmap**
   - Visual representation of hole difficulty
   - Color-coded by scoring average
   - Update every 5 minutes

2. **Live Insights Panel**
   ```
   🔥 Hole 17: Easiest hole today (3.2 avg, 45 birdies)
   ⚠️ Hole 11: Playing 0.8 over par
   🌊 Morning wave scoring 1.5 strokes better
   ```

3. **Player Progress Tracker**
   - Show which holes player is on
   - Expected score for remaining holes
   - Momentum indicators

4. **Competition Advantage Indicators**
   - "Your team has 3 players with strong putting approaching difficult greens!"
   - Real-time strategic insights

### Phase 3: Pre-Tournament Intelligence
**Use:** `pre-tournament` + `skill-decompositions`

**Features to Build:**
1. **Smart Team Builder**
   - AI-suggested lineups based on predictions
   - Value picks (high probability, low salary)
   - Balanced team composition

2. **Player Cards**
   - Win probability
   - Top 10 finish chance
   - Skill radar chart
   - Recent form indicator

3. **Matchup Analysis**
   - Compare golfers head-to-head
   - Best picks for specific competitions

---

## 📊 DATABASE SCHEMA ADDITIONS NEEDED

### For Live Scoring
```sql
-- Add to tournament_golfers table
ALTER TABLE tournament_golfers ADD COLUMN current_score INTEGER;
ALTER TABLE tournament_golfers ADD COLUMN current_round INTEGER;
ALTER TABLE tournament_golfers ADD COLUMN thru TEXT; -- "F", "18", "5*" (in progress)
ALTER TABLE tournament_golfers ADD COLUMN today_score INTEGER;
ALTER TABLE tournament_golfers ADD COLUMN r1_score INTEGER;
ALTER TABLE tournament_golfers ADD COLUMN r2_score INTEGER;
ALTER TABLE tournament_golfers ADD COLUMN r3_score INTEGER;
ALTER TABLE tournament_golfers ADD COLUMN r4_score INTEGER;
ALTER TABLE tournament_golfers ADD COLUMN sg_total DECIMAL(5,2);
ALTER TABLE tournament_golfers ADD COLUMN sg_ott DECIMAL(5,2);
ALTER TABLE tournament_golfers ADD COLUMN sg_app DECIMAL(5,2);
ALTER TABLE tournament_golfers ADD COLUMN sg_arg DECIMAL(5,2);
ALTER TABLE tournament_golfers ADD COLUMN sg_putt DECIMAL(5,2);
ALTER TABLE tournament_golfers ADD COLUMN last_updated TIMESTAMPTZ;

-- Create index for fast lookups during live scoring
CREATE INDEX idx_tournament_golfers_tournament_score 
ON tournament_golfers(tournament_id, current_score);
```

### For Hole Stats
```sql
-- New table for hole-by-hole data
CREATE TABLE tournament_hole_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  course_code TEXT,
  round_num INTEGER,
  hole INTEGER,
  par INTEGER,
  yardage INTEGER,
  avg_score DECIMAL(5,3),
  players_thru INTEGER,
  eagles_or_better INTEGER,
  birdies INTEGER,
  pars INTEGER,
  bogeys INTEGER,
  doubles_or_worse INTEGER,
  morning_wave_avg DECIMAL(5,3),
  afternoon_wave_avg DECIMAL(5,3),
  last_updated TIMESTAMPTZ,
  UNIQUE(tournament_id, course_code, round_num, hole)
);

CREATE INDEX idx_tournament_hole_stats_tournament 
ON tournament_hole_stats(tournament_id, round_num);
```

### For Player Skills
```sql
-- Add to golfers table
ALTER TABLE golfers ADD COLUMN dg_skill_estimate DECIMAL(5,2);
ALTER TABLE golfers ADD COLUMN driving_acc DECIMAL(5,2);
ALTER TABLE golfers ADD COLUMN driving_dist DECIMAL(5,2);
ALTER TABLE golfers ADD COLUMN approach DECIMAL(5,2);
ALTER TABLE golfers ADD COLUMN short_game DECIMAL(5,2);
ALTER TABLE golfers ADD COLUMN putting DECIMAL(5,2);
ALTER TABLE golfers ADD COLUMN skill_last_updated TIMESTAMPTZ;
```

---

## 🎯 IMPLEMENTATION PRIORITY

### 🔥 PHASE 1 (Do This Week)
1. **Live Scoring** - `live-tournament-stats` endpoint
   - Real-time leaderboard
   - Score updates every 60 seconds
   - Team score calculations

2. **Hole Stats** - `live-hole-stats` endpoint
   - Course difficulty visualization
   - Live insights panel
   - Unique differentiator for your platform!

### 🟡 PHASE 2 (Next 2 Weeks)
3. **Player Skills** - `skill-decompositions` endpoint
   - Enhanced team builder
   - Player comparison tools
   - Skill-based filters

4. **Pre-Tournament Predictions** - `pre-tournament` endpoint
   - Win probability displays
   - Smart pick suggestions
   - Value analysis

### 🟢 PHASE 3 (Future)
5. **Historical Data** - `historical-dg-rankings`
6. **Betting Odds Integration** - `betting-tools/outrights`

---

## 💡 UNIQUE FEATURES YOU CAN BUILD

### 1. **Live Course Intelligence**
Nobody else shows hole-by-hole difficulty in real-time during fantasy competitions!

### 2. **Momentum Tracker**
Track which players are "hot" based on last 6 holes scored

### 3. **Wave Advantage Alert**
"Morning wave players averaging 2.5 strokes better - your team has 4 morning starters!"

### 4. **Smart Substitutions**
For multi-round competitions, suggest optimal player swaps based on live data

### 5. **Predictive Scoring**
"Your team is projected to finish at -15 based on current pace and remaining holes"

### 6. **Skill-Based Matchmaking**
Create competitions that match players by skill level using DG skill estimates

---

## 📝 NEXT STEPS

1. **Implement live scoring sync job**
   ```typescript
   // Run every 60 seconds during live rounds
   setInterval(async () => {
     await syncLiveScores(tournamentId);
   }, 60000);
   ```

2. **Create hole stats visualization page**
   - Show course heatmap
   - Display live insights
   - Update every 5 minutes

3. **Add player skill data to profiles**
   - Sync skill decompositions daily
   - Display in golfer cards
   - Use in team builder filters

4. **Build predictive team builder**
   - Integrate pre-tournament predictions
   - Show win probability for each golfer
   - Calculate expected value vs salary

---

**Your DataGolf subscription is GOLD** 💰 - You have access to professional-grade data that can make your platform truly unique!

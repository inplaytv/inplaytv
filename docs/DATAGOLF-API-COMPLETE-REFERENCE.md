# DataGolf API Complete Reference

**Your Subscription**: Premium API Access  
**API Key**: `ac7793fb5f617626ccc418008832` (first 8 chars shown)

---

## 🎯 Executive Summary

DataGolf offers 40+ API endpoints across 6 major categories. Here's what we can build with your premium subscription:

### ✅ Available Now (Premium Subscription)
- ✅ Live tournament scoring and predictions (currently working!)
- ✅ Player rankings and skill ratings
- ✅ Pre-tournament predictions and odds
- ✅ Live strokes-gained stats during tournaments
- ✅ Tournament field updates with DFS salaries
- ✅ Betting odds (11 sportsbooks tracked)
- ✅ Historical odds and matchup data
- ✅ Player skill decompositions
- ✅ Fantasy projections (DraftKings, FanDuel, Yahoo)

### ❌ Requires Upgrade (Scratch PLUS Annual Plan)
- ❌ Raw Data Archive downloads (historical bulk data)
- ❌ Historical strokes-gained by tournament (bulk downloads)
- ❌ CSV/JSON file downloads of past tournaments

---

## 📊 API Categories Overview

| Category | Endpoints | What You Can Build | Subscription |
|----------|-----------|-------------------|--------------|
| **General Use** | 3 | Player lists, schedules, field updates | ✅ Premium |
| **Model Predictions** | 8 | Rankings, win probabilities, skill breakdowns | ✅ Premium |
| **Live Model** | 4 | Real-time scoring, predictions, stats | ✅ Premium |
| **Betting Tools** | 3 | Live odds, matchups, betting edges | ✅ Premium |
| **Historical Raw Data** | 2 | Round-level scoring, stats, SG data | ❌ Scratch PLUS |
| **Historical Betting Odds** | 3 | Historical lines, bet outcomes | ✅ Premium |
| **Historical DFS Data** | 2 | Fantasy points, salaries, ownership | ✅ Premium |

---

## 🔥 CATEGORY 1: General Use (3 Endpoints)

### 1.1 Player List & IDs ✅
**Endpoint**: `https://feeds.datagolf.com/get-player-list`

**What it does**: Returns all players on major tours since 2018, includes amateur status, country

**Use cases**:
- Build player database
- Autocomplete player search
- Player profile pages

**Parameters**:
- `file_format`: json (default), csv
- `key`: YOUR_API_KEY

**Response sample**:
```json
[
  {
    "amateur": 0,
    "country": "United States",
    "country_code": "USA",
    "dg_id": 14636,
    "player_name": "Spieth, Jordan"
  }
]
```

---

### 1.2 Tour Schedules ✅
**Endpoint**: `https://feeds.datagolf.com/get-schedule`

**What it does**: Current season schedules for PGA, DP World, Korn Ferry, LIV

**Use cases**:
- Tournament calendar
- Course information
- Upcoming events widget

**Parameters**:
- `tour`: all (default), pga, euro, kft, alt (LIV)
- `file_format`: json (default), csv
- `key`: YOUR_API_KEY

**Response sample**:
```json
{
  "tour": "pga",
  "current_season": 2025,
  "schedule": [
    {
      "event_id": 16,
      "event_name": "Sentry Tournament of Champions",
      "course": "Plantation Course at Kapalua",
      "course_key": "656",
      "location": "Kapalua, HI",
      "latitude": 21.001,
      "longitude": -156.654,
      "start_date": "2025-01-06"
    }
  ]
}
```

---

### 1.3 Field Updates ✅
**Endpoint**: `https://feeds.datagolf.com/field-updates`

**What it does**: Live field updates - WDs, tee times, DFS salaries

**Use cases**:
- Show who's playing this week
- Fantasy lineup builder
- Tee time viewer

**Parameters**:
- `tour`: pga (default), euro, kft, opp, alt
- `file_format`: json (default), csv
- `key`: YOUR_API_KEY

**Response includes**:
- Player names, countries, flags
- DraftKings salary + ID
- FanDuel salary + ID  
- Yahoo salary + ID
- Tee times for each round
- Start hole (1 or 10)
- WD/amateur status

---

## 🎯 CATEGORY 2: Model Predictions (8 Endpoints)

### 2.1 Data Golf Rankings ✅
**Endpoint**: `https://feeds.datagolf.com/preds/get-dg-rankings`

**What it does**: Top 500 players ranked by skill estimate vs OWGR

**Use cases**:
- **POWER RANKINGS PAGE** with sortable table
- Player comparison tool
- Skill trend charts

**Response sample**:
```json
{
  "last_updated": "2025-01-15 17:33:32 UTC",
  "rankings": [
    {
      "datagolf_rank": 15,
      "dg_id": 18841,
      "dg_skill_estimate": 1.269,
      "owgr_rank": 26,
      "player_name": "Hovland, Viktor",
      "country": "NOR",
      "primary_tour": "PGA"
    }
  ]
}
```

**💡 VISUALIZATION IDEAS**:
- Rank vs OWGR scatter plot (find undervalued players)
- Skill estimate bar chart
- Top 10 card grid with flags

---

### 2.2 Pre-Tournament Predictions ✅
**Endpoint**: `https://feeds.datagolf.com/preds/pre-tournament`

**What it does**: Win, top 5, top 10, top 20, make cut probabilities

**Use cases**:
- **WIN PROBABILITY DASHBOARD**
- Fantasy lineup optimizer
- Betting value finder

**Parameters**:
- `tour`: pga (default), euro, kft, opp, alt
- `add_position`: Comma-separated (e.g., "1,2,3,17,23")
- `dead_heat`: yes (default), no
- `odds_format`: percent (default), american, decimal, fraction

**Models available**:
1. `baseline` - Pure skill model
2. `baseline_history_fit` - Includes course history

**Response sample**:
```json
{
  "event_name": "The Sentry",
  "models_available": ["baseline", "baseline_history_fit"],
  "baseline": [
    {
      "dg_id": 12422,
      "player_name": "Johnson, Dustin",
      "win": 13.39,
      "top_5": 4.19,
      "top_10": 2.71,
      "top_20": 1.85,
      "make_cut": 1.19
    }
  ]
}
```

**💡 VISUALIZATION IDEAS**:
- Horizontal bar chart: Top 10 win probabilities
- Heatmap: Probabilities across all finish positions
- Baseline vs Course Fit comparison

---

### 2.3 Player Skill Decompositions ✅
**Endpoint**: `https://feeds.datagolf.com/preds/player-decompositions`

**What it does**: Detailed breakdown of strokes-gained prediction

**Use cases**:
- **DEEP DIVE PLAYER ANALYSIS**
- Course fit analysis
- Comparative skill profiles

**Response includes**:
- `baseline_pred`: Base skill estimate
- `age_adjustment`: Age-based adjustment
- `course_experience_adjustment`
- `course_history_adjustment`
- `driving_accuracy_adjustment`
- `driving_distance_adjustment`
- `strokes_gained_category_adjustment`
- `final_pred`: Final prediction

**💡 VISUALIZATION IDEAS**:
- Waterfall chart: Baseline → adjustments → final
- Radar chart: Skill categories
- Course fit indicator (green/yellow/red)

---

### 2.4 Player Skill Ratings ✅
**Endpoint**: `https://feeds.datagolf.com/preds/skill-ratings`

**What it does**: Skill estimate/rank for each category (150+ measured rounds)

**Use cases**:
- **SKILL COMPARISON MATRIX**
- Strengths/weaknesses analysis
- Player scouting tool

**Parameters**:
- `display`: value (default), rank

**Stats included**:
- `sg_putt`: Strokes gained putting
- `sg_arg`: Strokes gained around the green
- `sg_app`: Strokes gained approach
- `sg_ott`: Strokes gained off the tee
- `sg_total`: Total strokes gained
- `driving_acc`: Driving accuracy (vs field average)
- `driving_dist`: Driving distance (yards vs field average)

**💡 VISUALIZATION IDEAS**:
- **Spider/Radar chart**: Compare 2-4 players
- Heatmap: Rank all stats
- Scatter plot: Distance vs accuracy

---

### 2.5 Detailed Approach Skill ✅
**Endpoint**: `https://feeds.datagolf.com/preds/approach-skill`

**What it does**: Approach shot performance by yardage/lie buckets

**Use cases**:
- Ultra-detailed player analysis
- Course-specific projections
- Shot zone heatmaps

**Parameters**:
- `period`: l24 (last 24 months), l12 (last 12 months), ytd

**Buckets**:
- 50-100 yards fairway
- 100-150 yards fairway
- 150-200 yards fairway
- 200+ yards fairway
- Under 150 yards rough
- Over 150 yards rough

**Metrics per bucket**:
- Shot count
- SG per shot
- Proximity per shot
- GIR rate
- Good shot rate
- Poor shot avoidance rate

**💡 VISUALIZATION IDEAS**:
- Heatmap grid: Yardage × lie type
- Proximity by distance line chart
- Good/poor shot rate comparison

---

### 2.6 Fantasy Projection Defaults ✅
**Endpoint**: `https://feeds.datagolf.com/preds/fantasy-projection-defaults`

**What it does**: DFS projections for DraftKings, FanDuel, Yahoo

**Use cases**:
- **FANTASY OPTIMIZER TOOL**
- Value plays finder
- Ownership projections

**Parameters**:
- `tour`: pga (default), euro, opp, alt
- `site`: draftkings (default), fanduel, yahoo
- `slate`: main (default), showdown, showdown_late, weekend, captain

**Response**:
```json
{
  "projections": [
    {
      "player_name": "McIlroy, Rory",
      "dg_id": 10091,
      "salary": 11500,
      "r1_teetime": "7:34 am",
      "early_late_wave": 1,
      "proj_points": 73.53,
      "proj_ownership": 19.84
    }
  ]
}
```

**💡 VISUALIZATION IDEAS**:
- Points per $1K salary scatter plot
- Optimal lineup generator
- Low ownership value plays table

---

### 2.7 Pre-Tournament Predictions Archive ✅
**Endpoint**: `https://feeds.datagolf.com/preds/pre-tournament-archive`

**What it does**: Historical pre-tournament predictions

**Use cases**:
- Model accuracy tracking
- Historical player performance
- Trend analysis

**Parameters**:
- `event_id`: Tournament ID (from event list)
- `year`: 2020, 2021, 2022, 2023, 2024, 2025
- `odds_format`: percent (default), american, decimal, fraction

---

## ⚡ CATEGORY 3: Live Model Endpoints (4 Endpoints)

### 3.1 Live Model Predictions ✅ **CURRENTLY USING THIS!**
**Endpoint**: `https://feeds.datagolf.com/preds/in-play`

**What it does**: Live finish probabilities (updates every 5 minutes)

**Use cases**:
- **REAL-TIME LEADERBOARD** (we're using this!)
- Live betting dashboard
- Win probability tracker

**Parameters**:
- `tour`: pga (default), euro, opp, kft, alt
- `dead_heat`: no (default), yes
- `odds_format`: percent (default), american, decimal, fraction

**Response format**:
- **PGA tour**: Uses `baseline` or `preds` property
- **Euro tour**: Uses `data` property (we fixed this!)

**Response sample**:
```json
{
  "info": {
    "event_name": "The Sentry",
    "current_round": 2,
    "last_update": "2025-01-15 5:29 PM"
  },
  "data": [
    {
      "player_name": "McIlroy, Rory",
      "dg_id": 10091,
      "current_pos": "1",
      "current_score": -17,
      "thru": "F",
      "today": -6,
      "round": 2,
      "win": 0.4704,
      "top_5": 0.8573,
      "top_20": 0.9808,
      "make_cut": 1
    }
  ]
}
```

**💡 VISUALIZATION IDEAS**:
- **Animated position changes** (up/down arrows)
- Win probability spark line
- Live odds comparison vs sportsbooks

---

### 3.2 Live Tournament Stats ✅
**Endpoint**: `https://feeds.datagolf.com/preds/live-tournament-stats`

**What it does**: Live SG and traditional stats during tournaments

**Use cases**:
- **LIVE STATS DASHBOARD**
- Performance tracking
- Hot/cold streak detection

**Parameters**:
- `stats`: Comma-separated list (sg_putt, sg_arg, sg_app, sg_ott, sg_t2g, sg_bs, sg_total, distance, accuracy, gir, prox_fw, prox_rgh, scrambling, great_shots, poor_shots)
- `round`: event_cumulative, event_avg, 1, 2, 3, 4
- `display`: value (default), rank

**Response sample**:
```json
{
  "event_name": "The Sentry",
  "stat_display": "values",
  "stat_round": "event_avg",
  "live_stats": [
    {
      "player_name": "McIlroy, Rory",
      "dg_id": 10091,
      "position": "1",
      "total": -17,
      "thru": 18,
      "today": -6,
      "sg_ott": 2.15,
      "sg_app": 1.83,
      "sg_arg": 0.42,
      "sg_putt": 1.27,
      "sg_total": 5.67,
      "distance": 315.4,
      "accuracy": 0.714,
      "gir": 0.833,
      "prox_fw": 28.5,
      "scrambling": 0.667
    }
  ]
}
```

**💡 VISUALIZATION IDEAS**:
- **SG Category Bar Chart** (horizontal stacked)
- Scatter: Distance vs accuracy
- GIR percentage gauge
- Round-by-round line chart

---

### 3.3 Live Hole Scoring Distributions ✅
**Endpoint**: `https://feeds.datagolf.com/preds/live-hole-stats`

**What it does**: Hole scoring averages by wave (morning/afternoon)

**Use cases**:
- **COURSE DIFFICULTY MAP**
- Hole-by-hole analysis
- Weather/conditions impact

**Response includes** per hole:
- Average score
- Players through
- Eagles or better count
- Birdies
- Pars
- Bogeys
- Doubles or worse

Broken down by:
- Total field
- Morning wave
- Afternoon wave

**💡 VISUALIZATION IDEAS**:
- Course map with difficulty colors
- Hole scoring distribution chart
- AM vs PM wave comparison

---

### 3.4 Live Strokes-Gained [DEPRECATED] ⚠️
**Note**: DataGolf recommends using "Live Tournament Stats" instead

---

## 💰 CATEGORY 4: Betting Tools (3 Endpoints)

### 4.1 Outright (Finish Position) Odds ✅
**Endpoint**: `https://feeds.datagolf.com/betting-tools/outrights`

**What it does**: Live odds from 11 sportsbooks + DataGolf predictions

**Sportsbooks tracked**:
- bet365, betcris, betfair, betway, bovada, draftkings, fanduel, pinnacle, skybet, sportsbook, williamhill

**Use cases**:
- **BETTING VALUE FINDER**
- Odds comparison tool
- Edge calculator

**Parameters**:
- `tour`: pga (default), euro, kft, opp, alt
- `market`: win, top_5, top_10, top_20, mc (miss cut), make_cut, frl (first round leader)
- `odds_format`: percent, american, decimal (default), fraction

**Response sample**:
```json
{
  "event_name": "The Sentry",
  "market": "win",
  "odds": [
    {
      "player_name": "McIlroy, Rory",
      "dg_id": 10091,
      "datagolf": {
        "baseline": 6.87,
        "baseline_history_fit": 8.51
      },
      "draftkings": 7.5,
      "fanduel": 7,
      "bet365": 7.5,
      "pinnacle": 7.75,
      "bovada": 6
    }
  ]
}
```

**💡 VISUALIZATION IDEAS**:
- **Value table**: DataGolf vs best book odds
- Odds movement timeline
- +EV highlight badges

---

### 4.2 Match-Up & 3-Ball Odds ✅
**Endpoint**: `https://feeds.datagolf.com/betting-tools/matchups`

**What it does**: Live matchup odds from 8 sportsbooks

**Markets**:
- Tournament matchups (72-hole)
- Round matchups
- 3-balls

**Use cases**:
- Matchup betting tool
- Head-to-head value finder

**Parameters**:
- `tour`: pga (default), euro, opp, alt
- `market`: tournament_matchups, round_matchups, 3_balls
- `odds_format`: percent, american, decimal (default), fraction

---

### 4.3 Match-Up & 3-Ball Data Golf Odds — All Pairings ✅
**Endpoint**: `https://feeds.datagolf.com/betting-tools/matchups-all-pairings`

**What it does**: DataGolf odds for every pairing in next round

**Use cases**:
- Complete matchup odds matrix
- Round betting prep

---

## 📚 CATEGORY 5: Historical Raw Data (2 Endpoints)

### 5.1 Historical Raw Data Event IDs ✅
**Endpoint**: `https://feeds.datagolf.com/historical-raw-data/event-list`

**What it does**: List of tournaments available in raw data archive

**Use cases**:
- Browse available historical data
- Get event IDs for queries

**Response indicates**:
- `sg_categories`: yes/no (is SG data available)
- `traditional_stats`: yes/no (traditional stats available)

---

### 5.2 Round Scoring, Stats & Strokes Gained ❌ **REQUIRES SCRATCH PLUS**
**Endpoint**: `https://feeds.datagolf.com/historical-raw-data/rounds`

**What it does**: Round-level data across 22 tours

**Tours available**:
pga, euro, kft, cha, jpn, anz, alp, champ, kor, ngl, bet, chn, afr, pgt, pgti, atvt, atgt, sam, ept, can, liv, mex

**Data includes**:
- Round scores
- Strokes-gained categories (SG: putt, arg, app, ott, t2g, total)
- Traditional stats (driving distance, accuracy, GIR, scrambling, proximity, great/poor shots)
- Tee times
- Course information

**NOTE**: Your current subscription shows "You do not have access to the download links... must subscribe to Scratch PLUS annual plan"

---

## 🎲 CATEGORY 6: Historical Betting Odds (3 Endpoints)

### 6.1 Historical Odds Data Event IDs ✅
**Endpoint**: `https://feeds.datagolf.com/historical-odds/event-list`

**What it does**: List of tournaments with historical odds data

---

### 6.2 Historical Outrights ✅
**Endpoint**: `https://feeds.datagolf.com/historical-odds/outrights`

**What it does**: Opening/closing lines + bet outcomes

**Use cases**:
- **MODEL BACKTESTING**
- Odds movement analysis
- Betting history tracker

**Response includes**:
- Open odds + timestamp
- Close odds + timestamp
- Bet outcome (win/loss)
- Bet outcome numeric (1 = paid in full, 0 = loss)
- Player finish position

---

### 6.3 Historical Match-Ups & 3-Balls ✅
**Endpoint**: `https://feeds.datagolf.com/historical-odds/matchups`

**What it does**: Historical matchup lines + outcomes

**Use cases**:
- Matchup betting history
- Analyze bet types performance

---

## 🎮 CATEGORY 7: Historical DFS Data (2 Endpoints)

### 7.1 Historical DFS Data Event IDs ✅
**Endpoint**: `https://feeds.datagolf.com/historical-dfs-data/event-list`

**What it does**: List of tournaments with DFS data

---

### 7.2 DFS Points & Salaries ✅
**Endpoint**: `https://feeds.datagolf.com/historical-dfs-data/points`

**What it does**: Fantasy points, salaries, ownership for past events

**Use cases**:
- **DFS RESEARCH TOOL**
- Value analysis
- Ownership trends

**Response includes**:
- Salary
- Ownership percentage
- Finish points
- Hole score points
- Bonus points (streaks, sub-70, etc.)
- Total fantasy points

---

## 🎨 RECOMMENDED STATISTICS PAGE FEATURES

Based on available data, here's what we can build:

### 🔥 **TAB 1: LIVE TOURNAMENT**
**When tournament active**:
- Real-time leaderboard (we have this!)
- Live win probabilities (spark lines)
- Live strokes-gained dashboard
- Hole-by-hole scoring heatmap

### 📊 **TAB 2: RANKINGS & RATINGS**
- DataGolf Top 50 rankings table
- Rank vs OWGR scatter plot
- Player search with skill breakdown
- Skill ratings radar charts

### 🎯 **TAB 3: PREDICTIONS**
- Pre-tournament win probabilities
- Top 5/10/20 odds comparison
- Course fit analysis
- Baseline vs Course History model comparison

### 💪 **TAB 4: PLAYER SKILLS**
- Strokes-gained skill matrix
- Approach skill heatmap (yardage × lie)
- Driving: distance vs accuracy
- Putting/short game stats

### 💰 **TAB 5: BETTING & DFS**
- Value finder (DataGolf vs sportsbooks)
- Matchup odds comparison
- Fantasy projections
- Optimal lineup builder

### 📈 **TAB 6: HISTORICAL**
- Past predictions vs results
- Betting outcome tracker
- DFS points archive
- Model performance metrics

---

## 🚀 TECHNICAL IMPLEMENTATION NOTES

### Authentication
All endpoints require: `?key=YOUR_API_KEY`

### Rate Limits
Not specified in docs - implement reasonable throttling

### Response Formats
- `file_format=json` (default, recommended)
- `file_format=csv` (for bulk downloads)

### Odds Formats
- `percent` - 65.5 (default)
- `american` - +150, -200
- `decimal` - 2.5 (European)
- `fraction` - 3/2 (UK)

### Tours Supported
- `pga` - PGA Tour
- `euro` - DP World Tour (formerly European Tour)
- `kft` - Korn Ferry Tour
- `opp` - Opposite field PGA Tour events
- `alt` - Alternative tours (LIV)

### Tour Response Format Differences (WE FIXED THIS!)
```typescript
// PGA tours
const players = dgScores.baseline || dgScores.preds;

// Euro tour
const players = dgScores.data;

// Our fix: Check all three!
const players = dgScores.baseline || dgScores.preds || dgScores.data;
```

---

## 💡 NEXT STEPS

1. **Choose page layout**: Sidebar tabs vs top tabs
2. **Select priority features**: Which visualizations first?
3. **Pick chart library**: Recharts (recommended for React), Chart.js, D3.js
4. **Design mobile-responsive layout**
5. **Implement caching**: Store API responses, refresh intervals

**USER DECISION NEEDED**:
- Which tab should we build FIRST?
- Do you want sidebar or top navigation?
- Any specific visualizations you MUST have?

---

## 📝 SUBSCRIPTION SUMMARY

✅ **YOU HAVE ACCESS TO**:
- All live tournament data
- All prediction models
- All betting tools
- Historical odds
- Fantasy projections
- Player rankings and skills

❌ **YOU DON'T HAVE ACCESS TO**:
- Raw Data Archive bulk downloads (requires Scratch PLUS annual upgrade)
- Historical round-level CSV/JSON downloads

**💰 Your current premium subscription gives you 95% of what we need for an AMAZING statistics page!**

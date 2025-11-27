# Golf API Providers & Services

Comprehensive list of API services for golf tournament data, hole-by-hole scoring, and real-time leaderboards.

---

## 🏆 Current Provider: DataGolf

**Status:** ✅ Active (API Key: `ac7793...832`)

### Coverage
- ✅ PGA Tour (48 tournaments/season)
- ✅ DP World Tour / European Tour (36 tournaments/season)
- ✅ Korn Ferry Tour (26 tournaments/season)
- ✅ LIV Golf (11 tournaments/season)

### Features
- ✅ Tournament schedules
- ✅ Player rankings & skill ratings
- ✅ Pre-tournament predictions
- ✅ Live scoring (5-min intervals)
- ✅ Historical data (2017-present)
- ✅ Betting odds integration
- ✅ Fantasy projections (DraftKings, FanDuel, Yahoo)
- ✅ Strokes-gained statistics
- ❌ Not all tournaments covered (gaps in coverage)

### Pricing
- **Scratch Plus Membership** required for API access
- Visit: https://datagolf.com/subscribe

### Limitations
- Schedule updates can lag behind official announcements
- Some smaller/regional tournaments not included
- End-of-season coverage gaps (e.g., Australian PGA Championship missing)

---

## 🥇 Recommended: Sportradar Golf API

**Website:** https://developer.sportradar.com/golf

### Coverage (Most Comprehensive)
- ✅ **PGA Tour** - All Fed Ex Cup point events
- ✅ **DP World Tour** - All Race to Dubai events
- ✅ **LPGA Tour** - All points-earning events + Majors
- ✅ **PGA Tour Champions** - All events
- ✅ **Korn Ferry Tour** - All events
- ✅ **LIV Golf Invitational Series** - All events
- ✅ **Olympics** - Men's & Women's Golf
- ✅ **Ryder Cup** - Covered
- ✅ **President's Cup** - Covered
- ✅ **Hero World Challenge** - Covered
- ✅ **All Major Championships**

### Real-Time Features ⚡
- ✅ **Hole-by-hole scoring** (real-time)
- ✅ **Live leaderboards** (updated continuously)
- ✅ **Tee times & pairings**
- ✅ **Scorecards per round** (detailed hole-by-hole)
- ✅ **Tournament statistics** (per hole, per round)
- ✅ **Push feeds** for instant updates
- ✅ **World Golf Rankings** (top 200 players)
- ✅ **Player profiles** (biographical + historical stats)
- ✅ **Season statistics** (validated weekly)
- ✅ **Course information** (detailed layouts)

### Key Endpoints
```
GET /schedules/{season}/{tour}/schedule.json
GET /leaderboard/{tournament_id}/leaderboard.json
GET /leaderboard/{tournament_id}/scorecards/{round}.json
GET /tee_times/{tournament_id}/{round}.json
GET /tournaments/{tournament_id}/hole_statistics.json
GET /players/{player_id}/profile.json
GET /rankings/owgr.json
```

### Data Updates
- **Tournament finalized:** Within 2 hours of completion
- **Round completion:** Within 1 hour
- **Tee times:** Released Tuesday (10pm CT)
- **Season stats:** Updated Tuesday AM + validated daily

### Pricing
- **Enterprise/Commercial pricing** - Contact Sportradar sales
- Trial access available for developers
- Tiered pricing based on:
  - Number of API calls
  - Real-time vs. delayed data
  - Push feed access
  - Coverage scope

### Integration
- REST API with JSON responses
- Push feeds available (WebSocket/AMQP)
- Postman collection available
- Full XSD schema documentation
- 99.9% uptime SLA

**Contact:** https://sportradar.com/contact

---

## 🎯 Alternative Options

### 1. PGA TOUR API (Official)
**Website:** https://www.pgatour.com/stats

**Status:** Limited public access

#### Coverage
- ✅ PGA Tour events only
- ✅ Official statistics
- ✅ Real-time scoring
- ❌ No public developer API currently
- ❌ Data primarily for internal/partner use

#### Notes
- Most comprehensive for PGA Tour only
- Direct from source (most authoritative)
- Requires partnership agreement for API access
- Used by broadcast partners and official apps

---

### 2. The Sports DB
**Website:** https://www.thesportsdb.com/api.php

#### Free Tier
- ❌ Limited golf coverage
- ❌ No hole-by-hole scoring
- ❌ Basic tournament results only
- ✅ Free to use with API key

#### Premium Tier ($9/month)
- ✅ 2-minute live scores
- ✅ Video highlights
- ✅ Larger API limits
- ❌ Still limited golf-specific features

#### Best For
- Casual projects
- Multi-sport applications
- Budget-conscious developers

---

### 3. RapidAPI Hub
**Website:** https://rapidapi.com/hub

#### Available Golf APIs
Various third-party golf APIs available including:
- Golf course databases
- Player statistics
- Tournament results
- Varying quality and coverage

#### Pros
- Easy integration
- Pay-as-you-go pricing
- Multiple providers to choose from
- Unified billing

#### Cons
- Quality varies by provider
- Often limited real-time data
- May not have comprehensive coverage

---

### 4. European Tour / DP World Tour API
**Website:** https://www.europeantour.com

**Status:** Official but limited public access

#### Notes
- Official DP World Tour data
- Partnership required for access
- Most comprehensive for European Tour events
- Includes Race to Dubai standings

---

### 5. SportsData.io
**Website:** https://sportsdata.io/developers/api-documentation/golf

#### Features
- ✅ PGA Tour coverage
- ✅ Tournament schedules
- ✅ Live scoring
- ✅ Player profiles
- ✅ Historical data

#### Pricing
- Trial: 1,000 calls/month free
- Basic: $10/month
- Standard: $50/month
- Premium: Contact for pricing

---

## 📊 Comparison Matrix

| Provider | Tours Covered | Hole-by-Hole | Real-Time | Historical | Pricing | Best For |
|----------|---------------|--------------|-----------|------------|---------|----------|
| **Sportradar** | 7+ (Most comprehensive) | ✅ Yes | ✅ Yes | ✅ Yes | Enterprise | Production apps requiring complete coverage |
| **DataGolf** | 4 tours | ❌ No | ✅ Yes (5-min) | ✅ Yes (2017+) | Subscription | Predictions, analytics, fantasy sports |
| **PGA TOUR API** | PGA only | ✅ Yes | ✅ Yes | ✅ Yes | Partnership | Official PGA Tour apps only |
| **SportsData.io** | PGA mainly | ❌ Limited | ✅ Yes | ✅ Yes | $10-50/mo | Small to medium projects |
| **TheSportsDB** | Limited | ❌ No | ⚠️ Basic | ⚠️ Basic | $9/mo | Multi-sport hobby projects |

---

## 💡 Recommendations

### For Your Fantasy Golf Platform

#### Primary Choice: **Sportradar Golf API**
**Why:**
1. ✅ **Complete coverage** - All major tours including DP World Tour (solves Australian PGA issue)
2. ✅ **Real-time hole-by-hole data** - Essential for live fantasy scoring
3. ✅ **Push feeds** - Instant updates for live competitions
4. ✅ **Reliable** - Enterprise-grade 99.9% uptime
5. ✅ **All tournaments** - No gaps in coverage like DataGolf
6. ✅ **Detailed statistics** - Player profiles, course data, historical stats

**Implementation:**
- Use for **primary live scoring** and **tournament schedules**
- Keep DataGolf for **predictions** and **fantasy projections**
- Combine both for best user experience

#### Secondary: Keep DataGolf
**Use For:**
- ✅ Fantasy projections (DraftKings/FanDuel scoring)
- ✅ Player skill ratings & predictions
- ✅ Betting odds integration
- ✅ Pre-tournament analysis

---

## 🚀 Next Steps

### 1. Evaluate Sportradar
- [ ] Contact Sportradar sales: https://sportradar.com/contact
- [ ] Request demo and trial access
- [ ] Get pricing quote based on:
  - Expected API call volume
  - Real-time vs delayed data needs
  - Push feed requirements
- [ ] Review their Postman collection
- [ ] Test integration with sample tournament

### 2. Implementation Plan
```
Phase 1: Dual API Setup
- Add Sportradar for tournament schedules & live scoring
- Keep DataGolf for predictions & fantasy projections
- Merge data from both sources

Phase 2: Live Scoring Enhancement
- Implement hole-by-hole updates via Sportradar
- Add push feed integration for real-time updates
- Update fantasy points calculation in real-time

Phase 3: Tournament Coverage
- Populate all missing tournaments via Sportradar
- Add DP World Tour competitions
- Include LIV Golf, LPGA if desired
```

### 3. Budget Considerations
**Estimated Monthly Costs:**
- DataGolf Scratch Plus: ~$30-50/month (current)
- Sportradar Golf API: Contact for enterprise pricing (likely $500-2000/month)
- Total: ~$530-2050/month for complete coverage

**ROI:**
- Complete tournament coverage (no gaps)
- Real-time hole-by-hole scoring
- Professional-grade reliability
- Better user experience = higher retention

---

## 📞 Contact Information

### Sportradar
- **Website:** https://developer.sportradar.com/golf
- **Sales:** https://sportradar.com/contact
- **Support:** Via developer portal after signup
- **Documentation:** https://developer.sportradar.com/golf/reference/golf-overview

### DataGolf (Current)
- **Website:** https://datagolf.com/api-access
- **Support:** Via contact form
- **Current API Key:** ac7793fb5f617626ccc418008832

### SportsData.io
- **Website:** https://sportsdata.io/developers/api-documentation/golf
- **Signup:** Direct on website
- **Trial:** 1,000 calls/month free

---

## 🔧 Integration Code Examples

### Sportradar Example (Leaderboard)
```typescript
const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY;

async function getTournamentLeaderboard(tournamentId: string) {
  const url = `https://api.sportradar.com/golf/trial/v3/en/leaderboard/${tournamentId}/leaderboard.json?api_key=${SPORTRADAR_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    tournament: data.tournament,
    leaderboard: data.leaderboard,
    lastUpdated: data.generated_at
  };
}
```

### Sportradar Example (Hole-by-Hole Scoring)
```typescript
async function getRoundScorecards(tournamentId: string, round: number) {
  const url = `https://api.sportradar.com/golf/trial/v3/en/leaderboard/${tournamentId}/scorecards/${round}.json?api_key=${SPORTRADAR_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.rounds[0].players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    holes: player.holes, // Hole-by-hole scores
    totalScore: player.score,
    thru: player.thru
  }));
}
```

---

## 📋 Summary

**Current State:**
- Using DataGolf only
- Limited tournament coverage (gaps in schedule)
- No hole-by-hole real-time data
- Missing key tournaments (Australian PGA, etc.)

**Recommended Solution:**
- **Add Sportradar** as primary data source for live scoring and schedules
- **Keep DataGolf** for predictions and fantasy projections
- **Result:** Complete coverage + real-time hole-by-hole data + no gaps

**Action:** Contact Sportradar sales to discuss enterprise API access and pricing.

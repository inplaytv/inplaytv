# GOLFDATA Historical Raw Data - Implementation Plan

## Executive Summary

This document outlines the implementation strategy for leveraging DataGolf's Historical Raw Data (Scratch PLUS tier) to build advanced golf analytics features. This data includes granular round-by-round strokes gained statistics for every player, every tournament, dating back multiple years.

---

## 🎯 Priority 1: Player Performance Deep Dive (START HERE)

### Overview
Individual player pages showcasing historical strokes gained trends, course-specific performance, and recent form analysis.

### Route Structure
```
/golfdata/players                    → Player directory/search
/golfdata/players/[playerId]         → Main player page
/golfdata/players/[playerId]/sg      → Detailed SG analysis
/golfdata/players/[playerId]/courses → Course history
```

### Database Schema Additions

#### New Table: `player_round_stats`
```sql
CREATE TABLE player_round_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  golfer_id UUID REFERENCES golfers(id) NOT NULL,
  tournament_id UUID REFERENCES tournaments(id) NOT NULL,
  round_number INTEGER NOT NULL,
  event_date DATE NOT NULL,
  
  -- Basic scoring
  score INTEGER NOT NULL,
  course_par INTEGER NOT NULL,
  to_par INTEGER NOT NULL,
  
  -- Course details
  course_name TEXT,
  course_num INTEGER,
  
  -- Traditional stats
  birdies INTEGER,
  bogies INTEGER,
  eagles_or_better INTEGER,
  doubles_or_worse INTEGER,
  pars INTEGER,
  
  -- Strokes Gained (GOLD DATA)
  sg_ott DECIMAL(5,3),        -- Off the tee
  sg_app DECIMAL(5,3),        -- Approach
  sg_arg DECIMAL(5,3),        -- Around the green
  sg_putt DECIMAL(5,3),       -- Putting
  sg_t2g DECIMAL(5,3),        -- Tee to green
  sg_total DECIMAL(5,3),      -- Total strokes gained
  
  -- Driving stats
  driving_acc DECIMAL(5,3),
  driving_dist DECIMAL(6,2),
  
  -- Accuracy stats
  gir DECIMAL(5,3),           -- Greens in regulation
  scrambling DECIMAL(5,3),
  
  -- Proximity stats
  prox_fw DECIMAL(6,2),       -- Proximity from fairway (feet)
  prox_rgh DECIMAL(6,2),      -- Proximity from rough (feet)
  
  -- Shot quality
  great_shots INTEGER,
  poor_shots INTEGER,
  
  -- Metadata
  start_hole INTEGER,
  teetime TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_round UNIQUE (golfer_id, tournament_id, round_number)
);

-- Indexes for performance
CREATE INDEX idx_player_stats_golfer ON player_round_stats(golfer_id);
CREATE INDEX idx_player_stats_tournament ON player_round_stats(tournament_id);
CREATE INDEX idx_player_stats_date ON player_round_stats(event_date DESC);
CREATE INDEX idx_player_stats_sg_total ON player_round_stats(sg_total DESC);
```

#### New Table: `player_sg_averages` (Materialized View)
```sql
CREATE MATERIALIZED VIEW player_sg_averages AS
SELECT 
  golfer_id,
  COUNT(*) as rounds_played,
  
  -- Last 5 rounds
  AVG(CASE WHEN rn <= 5 THEN sg_total END) as sg_total_l5,
  AVG(CASE WHEN rn <= 5 THEN sg_ott END) as sg_ott_l5,
  AVG(CASE WHEN rn <= 5 THEN sg_app END) as sg_app_l5,
  AVG(CASE WHEN rn <= 5 THEN sg_arg END) as sg_arg_l5,
  AVG(CASE WHEN rn <= 5 THEN sg_putt END) as sg_putt_l5,
  
  -- Last 20 rounds
  AVG(CASE WHEN rn <= 20 THEN sg_total END) as sg_total_l20,
  AVG(CASE WHEN rn <= 20 THEN sg_ott END) as sg_ott_l20,
  AVG(CASE WHEN rn <= 20 THEN sg_app END) as sg_app_l20,
  AVG(CASE WHEN rn <= 20 THEN sg_arg END) as sg_arg_l20,
  AVG(CASE WHEN rn <= 20 THEN sg_putt END) as sg_putt_l20,
  
  -- Career
  AVG(sg_total) as sg_total_career,
  AVG(sg_ott) as sg_ott_career,
  AVG(sg_app) as sg_app_career,
  AVG(sg_arg) as sg_arg_career,
  AVG(sg_putt) as sg_putt_career,
  
  MAX(event_date) as last_round_date
FROM (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY golfer_id ORDER BY event_date DESC) as rn
  FROM player_round_stats
) ranked
GROUP BY golfer_id;

CREATE INDEX idx_sg_averages_golfer ON player_sg_averages(golfer_id);
```

### API Endpoints

#### 1. Get Player SG History
```typescript
// GET /api/golfdata/players/[playerId]/sg-history?period=l20

interface PlayerSGHistory {
  playerId: string;
  playerName: string;
  rounds: Array<{
    date: string;
    tournamentName: string;
    roundNumber: number;
    score: number;
    toPar: number;
    sg: {
      total: number;
      ott: number;
      app: number;
      arg: number;
      putt: number;
      t2g: number;
    };
  }>;
  averages: {
    last5: SGCategories;
    last20: SGCategories;
    career: SGCategories;
  };
}
```

#### 2. Get Player Course History
```typescript
// GET /api/golfdata/players/[playerId]/course-history?courseId=augusta

interface PlayerCourseHistory {
  playerId: string;
  courseName: string;
  appearances: number;
  rounds: Array<{
    year: number;
    finish: string;
    totalScore: number;
    avgSGTotal: number;
    roundScores: number[];
  }>;
  courseAverages: {
    avgFinish: number;
    avgScore: number;
    avgSGTotal: number;
    bestFinish: string;
    worstFinish: string;
  };
}
```

### UI Components

#### PlayerPageLayout.tsx
```typescript
- Header with player photo, name, ranking
- Tab navigation: Overview | SG Analysis | Course History | Recent Form
- Responsive grid layout
```

#### SGTrendChart.tsx
```typescript
- Line chart showing SG categories over last N rounds
- Toggle between categories (Total, OTT, APP, ARG, PUTT)
- Color-coded lines with legend
- Hover tooltips with tournament details
```

#### SGRadarChart.tsx
```typescript
- Radar/spider chart comparing player's SG categories
- Compare vs tour average
- Visual representation of strengths/weaknesses
```

#### RecentFormTable.tsx
```typescript
- Table of last 10-20 rounds
- Columns: Date, Tournament, Round, Score, SG Total, SG breakdown
- Color-coded cells (green = above average, red = below)
- Sortable columns
```

#### CourseHistoryCard.tsx
```typescript
- Card showing performance at specific course
- Key stats: Appearances, Avg Finish, Avg Score, Best/Worst
- Mini chart of SG trends at that course
```

### Implementation Steps

**Phase 1: Database & Data Import (Week 1)**
1. Create database tables and indexes
2. Build ETL script to import historical raw data from DataGolf
3. Populate `player_round_stats` table with historical data
4. Create and refresh materialized views

**Phase 2: API Layer (Week 2)**
5. Build API endpoints for player SG history
6. Build API endpoints for player course history
7. Add caching layer (Redis) for frequently accessed data
8. Implement rate limiting

**Phase 3: UI Components (Week 3)**
9. Build PlayerPageLayout component
10. Build SGTrendChart with Chart.js or Recharts
11. Build SGRadarChart component
12. Build RecentFormTable component
13. Build CourseHistoryCard component

**Phase 4: Integration & Polish (Week 4)**
14. Integrate all components into player page
15. Add loading states and error handling
16. Mobile responsiveness
17. SEO optimization (meta tags, structured data)
18. Performance optimization (lazy loading, pagination)

---

## 🎯 Priority 2: Course Fit Analyzer

### Overview
Tool that matches players to upcoming tournaments based on course characteristics and player's historical SG strengths.

### Database Schema

#### New Table: `course_characteristics`
```sql
CREATE TABLE course_characteristics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_name TEXT UNIQUE NOT NULL,
  
  -- Course type
  course_type TEXT, -- 'links', 'parkland', 'desert', 'mountain'
  
  -- Physical characteristics
  avg_length INTEGER,     -- Average total yardage
  avg_par DECIMAL(4,1),
  difficulty_rating DECIMAL(3,1),
  
  -- What this course rewards
  rewards_driving_accuracy BOOLEAN DEFAULT false,
  rewards_driving_distance BOOLEAN DEFAULT false,
  rewards_approach_play BOOLEAN DEFAULT false,
  rewards_short_game BOOLEAN DEFAULT false,
  rewards_putting BOOLEAN DEFAULT false,
  
  -- SG correlations (calculated from historical data)
  sg_ott_correlation DECIMAL(4,3),
  sg_app_correlation DECIMAL(4,3),
  sg_arg_correlation DECIMAL(4,3),
  sg_putt_correlation DECIMAL(4,3),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### UI Features
- Select upcoming tournament
- Shows top 20 players with best "course fit" scores
- Course fit score = weighted average of player's SG strengths matching course requirements
- Visual breakdown showing why each player fits the course
- Compare multiple players side-by-side

---

## 🎯 Priority 3: Form Tracker Dashboard

### Overview
Real-time dashboard showing which players are in peak form based on recent SG trends.

### Key Features
- **Hot List**: Players with improving SG trends (last 5 rounds > season average)
- **Cold List**: Players trending downward
- **Category Leaders**: Best in each SG category over last 10/20 rounds
- **Momentum Indicators**: Players with consistent positive/negative trends
- **Alerts**: Notify when followed players enter hot/cold streaks

### UI Components
- Filterable table with sortable columns
- Sparkline charts showing recent trend
- Color-coded indicators (🔥 hot, ❄️ cold, ➡️ neutral)
- Export to CSV for DFS analysis

---

## 🎯 Priority 4: Betting Tools (Premium Feature)

### Overview
Advanced analytics for sports bettors using historical SG data to find value.

### Features

#### Value Bet Finder
- Compare sportsbook odds to model predictions based on SG data
- Highlight +EV opportunities
- Track bet performance

#### In-Play Betting Dashboard
- Real-time updates showing which players are outperforming SG expectations
- Alert system for live betting opportunities
- "Surge" detection (player suddenly playing elite SG)

#### Prop Bet Analyzer
- Historical data for "Will Player X shoot under 68?" props
- Scoring distribution analysis
- Course-specific scoring trends

---

## 🎯 Priority 5: Fantasy Optimizer

### Overview
DFS lineup builder using historical SG data to maximize points per dollar.

### Features
- Salary cap optimizer for DraftKings, FanDuel, Yahoo
- Course-specific projections
- Ownership projections (contrarian plays)
- Correlation engine (stack players with similar game styles)
- Export optimal lineups

---

## Data Pipeline Architecture

### ETL Process

#### 1. Historical Data Import (One-time)
```bash
# Fetch historical raw data from DataGolf (2019-2024)
GET https://feeds.datagolf.com/historical-raw-data/event-list?file_format=json&key=API_KEY

# For each event:
GET https://feeds.datagolf.com/historical-raw-data/rounds?event_id=EVENT_ID&file_format=json&key=API_KEY

# Parse and insert into player_round_stats table
```

#### 2. Weekly Updates
```bash
# Fetch completed tournaments from current week
# Append to player_round_stats
# Refresh materialized views
```

#### 3. Materialized View Refresh Schedule
```sql
-- Refresh daily at 3 AM
REFRESH MATERIALIZED VIEW CONCURRENTLY player_sg_averages;
```

### Data Storage Estimates
- 100 tournaments/year × 150 players × 4 rounds = 60,000 rows/year
- 5 years historical data = ~300,000 rows
- Estimated storage: ~50MB for raw data + ~20MB for indexes = 70MB total
- Very manageable!

---

## Performance Optimization

### Caching Strategy
- Cache player SG averages: 1 hour TTL
- Cache course history: 24 hour TTL
- Cache tournament predictions: Until tournament starts

### Database Optimization
- Partitioning `player_round_stats` by year for faster queries
- Covering indexes for common query patterns
- Query optimization for complex SG aggregations

---

## Monetization Strategy

### Freemium Tiers

**Free Tier**
- Rankings & Skills (current GOLFDATA page)
- Player pages with last 5 rounds only
- Basic SG trends

**Premium Tier ($9.99/month)**
- Full historical data access
- Player Deep Dive (all features)
- Course Fit Analyzer
- Form Tracker
- Export to CSV

**Pro Tier ($19.99/month)**
- Everything in Premium
- Betting Tools (value finder, in-play alerts)
- Fantasy Optimizer
- API access for developers
- Priority support

---

## Development Timeline

### Month 1: Foundation
- Week 1: Database schema, ETL pipeline
- Week 2: Import historical data, test queries
- Week 3: Build Player Deep Dive page
- Week 4: Polish and deploy Player Deep Dive

### Month 2: Analytics Tools
- Week 1: Course Fit Analyzer
- Week 2: Form Tracker
- Week 3: Betting Tools (basic)
- Week 4: Testing and refinement

### Month 3: Advanced Features
- Week 1: Fantasy Optimizer
- Week 2: Mobile app optimization
- Week 3: Premium tier launch
- Week 4: Marketing and user acquisition

---

## Success Metrics

### Engagement Metrics
- Daily active users viewing player pages
- Average time spent on GOLFDATA section
- Pages per session
- Repeat visits per week

### Conversion Metrics
- Free to Premium conversion rate (target: 5%)
- Premium retention after 3 months (target: 70%)
- Average revenue per user

### Product Metrics
- Player page load time < 1.5 seconds
- API response time < 300ms
- Database query performance < 100ms
- Uptime > 99.9%

---

## Technical Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Chart.js or Recharts for visualizations
- TailwindCSS for styling

### Backend
- Next.js API routes
- Supabase PostgreSQL
- Redis for caching
- Vercel for hosting

### Data Processing
- Node.js ETL scripts
- Cron jobs for scheduled updates
- DataGolf API integration

---

## Risk Mitigation

### Data Availability Risk
- **Risk**: DataGolf API downtime or data quality issues
- **Mitigation**: Daily data validation checks, fallback to cached data, alerting system

### Performance Risk
- **Risk**: Slow queries with large datasets
- **Mitigation**: Proper indexing, materialized views, query optimization, pagination

### User Adoption Risk
- **Risk**: Users don't understand advanced SG metrics
- **Mitigation**: Educational tooltips, glossary page, video tutorials, simple visualizations

---

## Next Steps

1. **Review and approve this plan**
2. **Upgrade to DataGolf Scratch PLUS tier** ($299/year)
3. **Set up development environment**
4. **Build database schema and import historical data**
5. **Start with Player Deep Dive page (highest impact)**
6. **Iterate based on user feedback**

---

## Questions to Research

1. What's the DataGolf API rate limit for historical data?
2. Do they provide real-time updates during tournaments for new tier?
3. Is there a data dictionary for all fields in raw data?
4. Can we resell/redistribute this data? (likely no - check ToS)
5. What's the latency for new round data after tournaments end?

---

## Conclusion

The Historical Raw Data upgrade unlocks **game-changing features** that will differentiate InPlay Golf from all competitors. The Player Performance Deep Dive alone is worth the investment, and the additional analytics tools create multiple revenue streams through premium subscriptions.

**Estimated ROI**: 
- Cost: $299/year (DataGolf) + $2000 dev time (50 hours @ $40/hr)
- Revenue potential: 100 premium subs @ $9.99/mo = $11,988/year
- **ROI: 420%** in first year

**Recommendation: PROCEED IMMEDIATELY** 🚀

# Tournament Scoring System - Quick Reference

## 🎯 What This Solves

**Problem:** Currently only fetching live scores with no backup - if DataGolf has errors or goes down, we have no historical record.

**Solution:** Complete scoring management system that:
- 📊 **Stores every round score** as it happens
- 🛡️ **Protects against data loss** with historical backup
- ✏️ **Allows manual corrections** when API has errors
- 🔄 **Easy API migration** from DataGolf to SportsRadar
- 📈 **Professional scorecards** for admin and users

---

## 📚 System Components

```
┌──────────────────────────────────────────────────────────────┐
│                    SCORING SYSTEM                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐      ┌──────────────┐      ┌────────────┐ │
│  │  DataGolf   │──────│   Adapter    │──────│  Database  │ │
│  │   API       │      │   Pattern    │      │   Backup   │ │
│  └─────────────┘      └──────────────┘      └────────────┘ │
│        │                      │                     │        │
│        │                      │                     │        │
│        ▼                      ▼                     ▼        │
│  ┌─────────────┐      ┌──────────────┐      ┌────────────┐ │
│  │SportsRadar  │      │    Sync      │      │   Admin    │ │
│  │  (Future)   │      │   Service    │      │   Panel    │ │
│  └─────────────┘      └──────────────┘      └────────────┘ │
│                              │                     │         │
│                              │                     │         │
│                              ▼                     ▼         │
│                       ┌──────────────┐      ┌────────────┐ │
│                       │   Frontend   │      │   Audit    │ │
│                       │  Scorecard   │      │    Log     │ │
│                       └──────────────┘      └────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Structure

### New Table: `tournament_round_scores`

**Purpose:** Historical backup of every score

| Column | Type | Purpose |
|--------|------|---------|
| `tournament_id` | UUID | Links to tournament |
| `golfer_id` | UUID | Links to golfer |
| `round_number` | INT | 1, 2, 3, or 4 |
| `score` | INT | Actual score (68, 72, etc.) |
| `to_par` | INT | Relative to par (-4, E, +2) |
| `status` | VARCHAR | not_started / in_progress / completed / withdrawn |
| `data_source` | VARCHAR | datagolf / sportsradar / manual |
| `is_manual_override` | BOOL | TRUE if admin edited |
| `raw_api_data` | JSONB | Complete API response |
| `updated_by` | UUID | NULL for API, admin ID for manual |
| `notes` | TEXT | Reason for manual override |

**Key Features:**
- ✅ Stores complete API response for debugging
- ✅ Tracks who made changes
- ✅ Records why scores were manually edited
- ✅ Survives API provider changes

---

## 🎮 Admin Interface

### Tournament Scoring Dashboard
**URL:** `/admin/tournaments/[id]/scoring`

**Features:**
```
┌──────────────────────────────────────────────────────────────┐
│ BMW Australian PGA Championship - Scoring Dashboard          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Round 1] [Round 2] [Round 3] [Round 4] [Final]            │
│                                                              │
│  Last Updated: 2 min ago (DataGolf) [Sync Now]              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Pos │ Player         │ Score │ Status │ Source        │ │
│  ├─────┼────────────────┼───────┼────────┼───────────────┤ │
│  │  1  │ Rory McIlroy   │  68   │   ✅   │ DataGolf      │ │
│  │  2  │ Jon Rahm       │  67   │   🔴   │ Manual (Edit) │ │
│  │  T3 │ Scottie S.     │  69   │   🟡   │ In Progress   │ │
│  └─────┴────────────────┴───────┴────────┴───────────────┘ │
│                                                              │
│  [Export PDF] [View Audit Log] [Mark Official]              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Manual Override:**
- Click any score to edit
- Enter correct score
- Add reason: "DataGolf showed 67, PGA.com official is 68"
- System logs who, when, and why

---

## 🔄 Data Flow

### Live Tournament Scoring

```
┌────────────┐
│  DataGolf  │  Updates every 5 minutes
│    API     │
└─────┬──────┘
      │
      ▼
┌────────────────┐
│  Sync Service  │  Runs every 5 min during tournament
│  (Cron Job)    │
└───────┬────────┘
        │
        ├──────────┐
        │          │
        ▼          ▼
┌──────────┐  ┌──────────────────────┐
│Tournament│  │tournament_round_scores│  Stores each round
│ Golfers  │  │  (Historical Backup)  │
└──────────┘  └──────────────────────┘
        │              │
        ▼              ▼
   ┌─────────────────────┐
   │  Frontend Scorecard │
   │  (Auto-refreshes)   │
   └─────────────────────┘
```

### Manual Override Flow

```
┌──────────┐
│  Admin   │  Sees error: "DataGolf shows 67, PGA.com shows 68"
└────┬─────┘
     │
     ▼
┌────────────────┐
│  Click Score   │  Opens edit modal
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Enter: 68     │
│  Reason: "..."  │
└───────┬────────┘
        │
        ▼
┌─────────────────────┐
│  Save to Database   │  is_manual_override = TRUE
│  + Audit Log Entry  │  updated_by = admin_id
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │  Frontend    │  Shows updated score immediately
    │  Updates     │
    └──────────────┘
```

---

## 🔧 API Migration (DataGolf → SportsRadar)

**Current Setup:**
```typescript
// Tightly coupled to DataGolf
const scores = await fetch('https://feeds.datagolf.com/...');
```

**New Setup (Adapter Pattern):**
```typescript
// Provider-agnostic
const scoringService = new ScoringService(); // Auto-detects provider from .env
const scores = await scoringService.fetchLiveScores(tournamentId);
```

**To Switch Providers:**
1. Update `.env`: `SCORING_PROVIDER=sportsradar`
2. Add SportsRadar API key
3. Deploy
4. **That's it!** - No code changes needed

---

## 📊 DataGolf API Capabilities

### What We Get:

✅ **Live Scores** (`preds/in-play`)
- All 4 round scores (R1, R2, R3, R4)
- Current position
- Holes through
- Updates every 5 minutes

✅ **Historical Scores** (`historical-raw-data/event-results`)
- Complete final results
- All round scores
- Prize money, FedEx points

✅ **Tournament Field** (`field-updates`)
- List of golfers
- Tee times for each round
- Withdrawal status

### What We DON'T Get:

❌ Hole-by-hole scores (requires premium endpoint)
❌ Shot-by-shot tracking
❌ Live video highlights

**Recommendation:** Start with what DataGolf provides (round scores), add hole-by-hole later if needed

---

## 🚀 Implementation Plan

### Phase 1: Core System (Week 1) ⭐ START HERE
```
Day 1-2: Database
  - Create tournament_round_scores table
  - Add score columns to tournament_golfers
  - Create indexes

Day 3-4: Sync Service
  - Build DataGolfAdapter
  - Create sync endpoint
  - Implement retry logic

Day 5: Automation
  - Set up cron job
  - Test with live tournament
```

### Phase 2: Admin Interface (Week 2)
```
Day 1-2: Scoring Dashboard
  - Build UI with round tabs
  - Display all scores

Day 3-4: Manual Override
  - Edit modal
  - Save overrides
  - Audit logging

Day 5: Scorecard View
  - Professional scorecard display
  - Export PDF capability
```

### Phase 3: Frontend (Week 3)
```
Day 1-3: User Scorecard
  - Build TournamentScorecard component
  - Add to leaderboards page
  - Auto-refresh every 30 seconds

Day 4-5: Polish
  - Mobile responsive
  - Loading states
  - Error handling
```

---

## 💰 Cost Comparison

| Provider | Cost | Update Frequency | Data Quality |
|----------|------|-----------------|--------------|
| **DataGolf** | ~$200/month | 5 minutes | Good ✅ |
| **SportsRadar** | ~$2,000+/month | Real-time | Excellent ⭐ |

**Recommendation:** Start with DataGolf, upgrade to SportsRadar when revenue supports it.

---

## ❓ Questions to Answer

1. **Who can override scores?**
   - Option A: Super admin only
   - Option B: Tournament managers too
   - **Recommendation:** Start with admin only

2. **Lock completed rounds?**
   - Should Round 1 stop updating once Round 2 starts?
   - **Recommendation:** Yes, lock after 24 hours

3. **Alert system?**
   - Email when sync fails?
   - **Recommendation:** Yes, email admin immediately

4. **Import historical data?**
   - Import past tournament scores from DataGolf?
   - **Recommendation:** Yes, for last 3 months

5. **Cut line detection?**
   - Automatically mark players who missed cut?
   - **Recommendation:** Yes, after Round 2 completion

---

## ✅ Next Steps

**Ready to proceed?** I can start implementing Phase 1 today:

1. Create database tables
2. Build DataGolfAdapter
3. Create sync service
4. Set up cron job
5. Test with BMW Australian PGA Championship

**Just confirm:**
- ✅ Design looks good?
- ✅ Any questions answered?
- ✅ Ready to start implementation?

Then I'll begin coding! 🚀

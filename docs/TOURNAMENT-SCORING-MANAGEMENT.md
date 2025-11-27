# Tournament Scoring Management System

## Overview

A comprehensive system for reliably capturing, storing, and managing tournament scoring data. This system provides multiple layers of data collection with backup and manual management capabilities.

## System Architecture

### Data Flow
```
DataGolf API (Primary Source)
    ↓
Tournament Sync Service (Automated)
    ↓
Database (Permanent Storage)
    ↓
Admin Interface (Manual Management)
    ↓
Frontend Display (User View)
```

### Data Sources (DataGolf)

1. **Live Scoring** (`/preds/in-play`)
   - Updates every 5 minutes during tournaments
   - Current round, position, score, thru
   - Used for: Real-time displays

2. **Historical Results** (`/historical-raw-data/event-results`)
   - Complete tournament results with all 4 rounds
   - Final positions and scores
   - Used for: Post-tournament data, backup

3. **Round Details** (`/historical-raw-data/rounds`)
   - Round-by-round scoring
   - Strokes-gained stats
   - Traditional stats
   - Used for: Detailed analysis

## Database Schema

### New Table: `tournament_round_scores`
```sql
CREATE TABLE tournament_round_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) NOT NULL,
  golfer_id UUID REFERENCES golfers(id) NOT NULL,
  
  -- Round data
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 4),
  score INTEGER, -- Round score
  to_par INTEGER, -- Score to par for round
  
  -- Position tracking
  position TEXT, -- Position after this round
  position_numeric INTEGER, -- For sorting
  
  -- Round stats
  birdies INTEGER DEFAULT 0,
  eagles INTEGER DEFAULT 0,
  bogeys INTEGER DEFAULT 0,
  double_bogeys INTEGER DEFAULT 0,
  
  -- Data source tracking
  data_source TEXT DEFAULT 'datagolf', -- 'datagolf', 'sportradar', 'manual'
  data_quality TEXT DEFAULT 'verified', -- 'verified', 'estimated', 'manual'
  
  -- Metadata
  synced_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tournament_id, golfer_id, round_number)
);

CREATE INDEX idx_tournament_round_scores_tournament ON tournament_round_scores(tournament_id);
CREATE INDEX idx_tournament_round_scores_golfer ON tournament_round_scores(golfer_id);
```

### New Table: `tournament_sync_log`
```sql
CREATE TABLE tournament_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) NOT NULL,
  
  -- Sync details
  sync_type TEXT NOT NULL, -- 'live', 'historical', 'manual'
  data_source TEXT NOT NULL, -- 'datagolf', 'sportradar'
  endpoint TEXT, -- API endpoint used
  
  -- Results
  status TEXT NOT NULL, -- 'success', 'partial', 'failed'
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Metadata
  synced_at TIMESTAMP DEFAULT NOW(),
  synced_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_tournament_sync_log_tournament ON tournament_sync_log(tournament_id);
```

## API Endpoints

### 1. Tournament Sync API
**POST** `/api/admin/tournaments/[id]/sync`

Fetches and stores all scoring data for a tournament.

```typescript
// Request
{
  "source": "datagolf" | "sportradar" | "both",
  "forceRefresh": boolean
}

// Response
{
  "success": true,
  "tournament": {
    "id": "uuid",
    "name": "RSM Classic",
    "status": "completed"
  },
  "rounds": {
    "1": { "synced": 156, "errors": 0 },
    "2": { "synced": 156, "errors": 0 },
    "3": { "synced": 72, "errors": 0 },
    "4": { "synced": 72, "errors": 0 }
  },
  "syncLog": {
    "id": "uuid",
    "syncedAt": "2025-11-27T10:00:00Z"
  }
}
```

### 2. Round Scores API
**GET** `/api/tournaments/[id]/round-scores`

Retrieves stored round scores from database.

```typescript
// Query params
?round=1-4 (optional, defaults to all rounds)

// Response
{
  "tournament": {
    "id": "uuid",
    "name": "RSM Classic"
  },
  "rounds": [
    {
      "round": 1,
      "golfers": [
        {
          "id": "uuid",
          "name": "Scottie Scheffler",
          "score": 68,
          "toPar": -4,
          "position": "1",
          "birdies": 6,
          "eagles": 0,
          "bogeys": 2
        }
      ]
    }
  ]
}
```

### 3. Manual Entry API
**POST** `/api/admin/tournaments/[id]/round-scores/manual`

Allows manual entry/correction of round scores.

```typescript
// Request
{
  "golferId": "uuid",
  "round": 1,
  "score": 68,
  "birdies": 6,
  "eagles": 0,
  "bogeys": 2,
  "position": "T1",
  "notes": "Manual correction - original data incorrect"
}

// Response
{
  "success": true,
  "roundScore": { /* stored data */ }
}
```

## Admin Interface Components

### 1. Tournament Scoring Dashboard
**Location:** `/admin/tournaments/[id]/scoring`

**Features:**
- Visual display of all 4 rounds
- Sync status indicators
- Data quality warnings
- Manual override capability
- Sync history log

### 2. Bulk Sync Interface
**Location:** `/admin/tournaments/sync`

**Features:**
- Sync multiple tournaments at once
- Schedule automatic syncs
- Set up recurring syncs for active tournaments
- Bulk data validation

### 3. Data Quality Monitor
**Location:** `/admin/tournaments/data-quality`

**Features:**
- Missing round alerts
- Incomplete data warnings
- Discrepancy detection
- Data source comparison (when multiple sources available)

## Migration Path to Sportradar

### Design Considerations

1. **Abstracted Data Layer**
   - All API calls go through a unified service layer
   - Easy to swap data sources

2. **Unified Data Format**
   - Internal format matches both DataGolf and Sportradar structures
   - Transformation layer handles differences

3. **Dual-Source Support**
   - Can use both APIs simultaneously
   - Automatic fallback if one fails
   - Data comparison for validation

### Migration Steps

1. Add Sportradar credentials
2. Implement Sportradar adapter (same interface as DataGolf)
3. Run dual-source for validation period
4. Switch primary source to Sportradar
5. Keep DataGolf as backup

## Automation Strategy

### Scheduled Tasks

1. **During Tournament (Live)**
   - Sync every 5 minutes during tournament hours
   - Use `/preds/in-play` endpoint
   - Auto-store to database

2. **Post-Tournament**
   - Run historical sync 1 hour after tournament ends
   - Use `/historical-raw-data/event-results`
   - Validate all 4 rounds present

3. **Daily Maintenance**
   - Check data completeness
   - Alert on missing data
   - Auto-retry failed syncs

## Error Handling

### Levels

1. **Warning** - Data incomplete but usable
2. **Error** - Data missing, requires attention
3. **Critical** - System failure, immediate action needed

### Recovery

1. **Automatic Retry** - Failed sync retries 3 times with exponential backoff
2. **Fallback Source** - Try alternative endpoint if primary fails
3. **Manual Override** - Admin can manually enter data
4. **Alert System** - Notifications for critical failures

## Benefits

✅ **Reliability** - Multiple data sources with automatic fallback
✅ **Backup** - All data permanently stored in database
✅ **Manual Control** - Admin can correct/override any data
✅ **Audit Trail** - Complete log of all data changes
✅ **Future-Proof** - Easy migration to new data sources
✅ **Data Quality** - Validation and monitoring built-in
✅ **Transparency** - Users can see data source and quality

## Implementation Priority

### Phase 1 (Immediate)
1. Create database tables
2. Build basic sync API
3. Admin interface for manual entry
4. Display stored data on frontend

### Phase 2 (Short-term)
1. Automated sync scheduling
2. Data quality monitoring
3. Bulk sync tools
4. Enhanced admin dashboard

### Phase 3 (Future)
1. Sportradar integration
2. Dual-source validation
3. Advanced analytics
4. Historical data backfill

# Tournament Scoring System - Phase 1 Implementation

## ✅ What's Been Implemented

### 1. Database Schema
- **`tournament_round_scores`** table - Stores all round scores with audit trail
- **`tournament_score_audit_log`** table - Tracks all changes to scores
- Automatic triggers for audit logging
- Automatic sync to `tournament_golfers` denormalized columns
- Row Level Security (RLS) policies for data protection

### 2. Scoring Service Package
- **`@inplaytv/scoring-service`** - Provider-agnostic scoring library
- `DataGolfAdapter` - Fetches scores from DataGolf API
- `ScoringService` - Factory pattern for easy provider switching
- Retry logic with exponential backoff (1s, 5s, 15s)
- Full TypeScript type safety

### 3. Admin API Endpoints
- **POST** `/api/admin/tournaments/[id]/sync-scores` - Sync scores for one tournament
- **GET** `/api/admin/tournaments/[id]/sync-scores` - View sync status
- **GET** `/api/cron/sync-tournament-scores` - Auto-sync all live tournaments

### 4. Automated Sync
- Vercel Cron job runs every 5 minutes
- Only syncs tournaments with status: `registration_closed` or `live`
- Respects manual overrides (won't overwrite admin edits)
- Comprehensive error logging

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
# Connect to your Supabase database
psql postgresql://[YOUR_SUPABASE_CONNECTION_STRING]

# Run the migration
\i scripts/create-tournament-round-scores-table.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `scripts/create-tournament-round-scores-table.sql`
3. Run query

### Step 2: Install Dependencies

```bash
# From root of monorepo
pnpm install
```

The scoring-service package will be linked automatically via the workspace.

### Step 3: Add Environment Variables

Add to **`apps/admin/.env.local`**:

```bash
# DataGolf API (already configured)
DATAGOLF_API_KEY=your_api_key_here

# Scoring Provider (optional - defaults to 'datagolf')
SCORING_PROVIDER=datagolf

# Cron Secret (for securing automated sync)
CRON_SECRET=your_random_secret_here_min_32_chars

# App URL (for cron job to call API)
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

Generate a secure CRON_SECRET:
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 4: Deploy

```bash
# Build all apps
turbo build

# Deploy to Vercel (or your hosting provider)
vercel deploy
```

The cron job will automatically be configured via `apps/admin/vercel.json`.

---

## 📊 How It Works

### Automatic Sync Flow

```
Every 5 minutes
    ↓
Cron Job: /api/cron/sync-tournament-scores
    ↓
Find all tournaments with status 'live' or 'registration_closed'
    ↓
For each tournament:
    ↓
    Call: POST /api/admin/tournaments/[id]/sync-scores
        ↓
        Fetch scores from DataGolf
        ↓
        For each player, for each round:
            ↓
            Check if score exists in database
            ↓
            If manual override → Skip (preserve admin edit)
            ↓
            If exists → UPDATE score
            ↓
            If new → INSERT score
            ↓
            Trigger fires → Log to audit table
            ↓
            Trigger fires → Sync to tournament_golfers
    ↓
Return stats: created, updated, errors
```

### Manual Override Protection

When an admin manually edits a score:
1. `is_manual_override = TRUE` is set
2. `updated_by = admin_user_id` is recorded
3. `notes` field contains reason for override
4. Automatic sync will **skip** this score
5. Manual override stays in place until admin removes it

---

## 🧪 Testing

### Test 1: Manual Sync for One Tournament

```bash
# Get tournament ID from database or admin panel
TOURNAMENT_ID="your-tournament-uuid"

# Call sync endpoint
curl -X POST http://localhost:3002/api/admin/tournaments/$TOURNAMENT_ID/sync-scores \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "tournament": {
    "id": "...",
    "name": "BMW Australian PGA Championship",
    "currentRound": 2
  },
  "stats": {
    "playersProcessed": 156,
    "scoresCreated": 45,
    "scoresUpdated": 12,
    "errors": 0
  }
}
```

### Test 2: Check Sync Status

```bash
curl http://localhost:3002/api/admin/tournaments/$TOURNAMENT_ID/sync-scores
```

Expected response:
```json
{
  "tournament": {
    "id": "...",
    "name": "BMW Australian PGA Championship",
    "status": "live",
    "currentRound": 2,
    "lastUpdated": "2024-11-28T10:30:00Z"
  },
  "scoreCounts": {
    "round1": 156,
    "round2": 78,
    "round3": 0,
    "round4": 0
  },
  "latestScores": [...]
}
```

### Test 3: Trigger Cron Job Manually

```bash
curl http://localhost:3002/api/cron/sync-tournament-scores \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2024-11-28T10:35:00Z",
  "tournamentsProcessed": 2,
  "tournamentResults": [
    {
      "id": "...",
      "name": "BMW Australian PGA Championship",
      "success": true,
      "scoresUpdated": 57
    },
    {
      "id": "...",
      "name": "Hero World Challenge",
      "success": true,
      "scoresUpdated": 20
    }
  ],
  "duration": "3245ms"
}
```

### Test 4: Query Database Directly

```sql
-- Check recent scores
SELECT 
  g.full_name,
  trs.round_number,
  trs.score,
  trs.to_par,
  trs.status,
  trs.data_source,
  trs.is_manual_override,
  trs.updated_at
FROM tournament_round_scores trs
JOIN golfers g ON g.id = trs.golfer_id
WHERE trs.tournament_id = 'YOUR_TOURNAMENT_ID'
ORDER BY trs.updated_at DESC
LIMIT 20;

-- Check audit log
SELECT 
  g.full_name,
  tsa.round_number,
  tsa.action,
  tsa.old_score,
  tsa.new_score,
  tsa.change_reason,
  tsa.changed_at
FROM tournament_score_audit_log tsa
JOIN golfers g ON g.id = tsa.golfer_id
WHERE tsa.tournament_id = 'YOUR_TOURNAMENT_ID'
ORDER BY tsa.changed_at DESC
LIMIT 20;
```

---

## 🔧 Configuration Options

### Change Sync Frequency

Edit `apps/admin/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-tournament-scores",
      "schedule": "*/5 * * * *"  // Every 5 minutes
      // "schedule": "*/2 * * * *"  // Every 2 minutes (more frequent)
      // "schedule": "*/10 * * * *"  // Every 10 minutes (less frequent)
    }
  ]
}
```

Cron syntax:
- `*/5 * * * *` = Every 5 minutes
- `0 * * * *` = Every hour on the hour
- `0 */3 * * *` = Every 3 hours
- `0 0 * * *` = Once per day at midnight

### Switch to SportsRadar (Future)

When ready to upgrade:

1. Get SportsRadar API key
2. Add to `.env.local`:
   ```bash
   SCORING_PROVIDER=sportsradar
   SPORTSRADAR_API_KEY=your_key_here
   ```
3. Implement `SportsRadarAdapter` in scoring-service package
4. Deploy - **no other code changes needed!**

---

## 📈 Monitoring

### Check Cron Job Logs

**Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Cron Jobs" tab
4. View execution logs

**Locally:**
```bash
# Watch admin logs
cd apps/admin
pnpm dev

# In another terminal, trigger cron manually
curl http://localhost:3002/api/cron/sync-tournament-scores \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Database Monitoring

```sql
-- Count scores by tournament
SELECT 
  t.name,
  COUNT(trs.id) as total_scores,
  COUNT(DISTINCT trs.golfer_id) as unique_players,
  MAX(trs.updated_at) as last_update
FROM tournaments t
LEFT JOIN tournament_round_scores trs ON trs.tournament_id = t.id
WHERE t.status IN ('live', 'registration_closed')
GROUP BY t.id, t.name
ORDER BY last_update DESC;

-- Check for sync errors
SELECT 
  t.name,
  trs.data_source,
  COUNT(*) as count
FROM tournament_round_scores trs
JOIN tournaments t ON t.id = trs.tournament_id
WHERE trs.score IS NULL  -- Missing scores might indicate sync issues
GROUP BY t.name, trs.data_source;
```

---

## 🐛 Troubleshooting

### Issue: Cron job not running

**Solution:**
1. Check `vercel.json` is in the correct location
2. Verify `CRON_SECRET` is set in Vercel environment variables
3. Check cron job is enabled in Vercel dashboard
4. Trigger manually to test: `curl ... /api/cron/sync-tournament-scores`

### Issue: DataGolf API errors

**Solution:**
1. Verify `DATAGOLF_API_KEY` is correct
2. Check API rate limits (DataGolf may throttle)
3. Review logs for specific error messages
4. Test API directly: `curl "https://feeds.datagolf.com/preds/in-play?tour=pga&key=YOUR_KEY"`

### Issue: Scores not appearing

**Solution:**
1. Check tournament has `event_id` set (required for DataGolf mapping)
2. Verify tournament status is `live` or `registration_closed`
3. Manually trigger sync: `POST /api/admin/tournaments/[id]/sync-scores`
4. Query database to see if scores are stored but not displayed
5. Check frontend is reading from `tournament_round_scores` table

### Issue: Manual overrides being overwritten

**Solution:**
1. Verify `is_manual_override = TRUE` is set on the score
2. Check `updated_by` field has admin user ID
3. Review sync logs to see if override check is working
4. If still overwriting, there may be a bug in the sync logic

---

## 📝 Next Steps (Phase 2)

- [ ] Build admin scoring dashboard UI
- [ ] Implement manual score override interface
- [ ] Add audit log viewer
- [ ] Create scorecard export (PDF)
- [ ] Add email notifications for sync failures
- [ ] Implement score locking after round completion
- [ ] Add cut line detection

---

## 🎯 Key Files Reference

### Database
- `scripts/create-tournament-round-scores-table.sql` - Main migration

### Backend
- `packages/scoring-service/src/index.ts` - Scoring service with DataGolf adapter
- `apps/admin/src/app/api/tournaments/[id]/sync-scores/route.ts` - Sync endpoint
- `apps/admin/src/app/api/cron/sync-tournament-scores/route.ts` - Cron job

### Configuration
- `apps/admin/vercel.json` - Cron job schedule
- `apps/admin/.env.local` - Environment variables

### Documentation
- `docs/SCORING-SYSTEM-DESIGN.md` - Complete design specification
- `docs/SCORING-SYSTEM-QUICK-REF.md` - Visual quick reference
- This file - Implementation guide

---

**Questions?** Check the design docs or test with a live tournament!

# CRITICAL FIX: Automated Golfer Field Population

## Problem
Tournaments starting in 1.5 days have NO golfers assigned. Users cannot build teams because the `tournament_golfers` table is empty for upcoming tournaments.

## Root Cause
The system had:
- ✅ Manual sync endpoint: `/api/tournaments/[id]/sync-golfers`
- ❌ NO automated cron job to sync golfers before tournaments start

Golfers must be synced **6 days before tournament start** but there was no automation.

## Solution Implemented

### 1. Created Automated Cron Job
**File:** `/apps/admin/src/app/api/cron/sync-tournament-golfers/route.ts`

**Features:**
- Runs daily (or every 6 hours)
- Finds tournaments starting within 6 days
- Skips tournaments that already have golfers
- Syncs from DataGolf API automatically
- Creates new golfers if needed
- Assigns salaries ($8k-$12k range)
- Comprehensive logging and error handling

**How It Works:**
1. Query tournaments with `status='upcoming'` AND `start_date <= 6 days from now`
2. Check if `tournament_golfers` exists for each
3. If empty → Fetch field from DataGolf API
4. Create missing golfers in `golfers` table
5. Insert records into `tournament_golfers` table
6. Return summary of synced/skipped/errors

### 2. Emergency Fix Script
**File:** `/scripts/emergency-sync-golfers.ps1`

Run this **NOW** to fix current tournaments:

```powershell
cd C:\inplaytv
.\scripts\emergency-sync-golfers.ps1
```

This will:
- ✅ Sync all tournaments starting in next 6 days
- ✅ Populate `tournament_golfers` table
- ✅ Show detailed results
- ✅ Report any errors

## Immediate Action Required

### Step 1: Run Emergency Sync (NOW!)
```powershell
# Make sure admin app is running
pnpm run dev:admin

# In another terminal:
.\scripts\emergency-sync-golfers.ps1
```

### Step 2: Verify Golfers Were Added
Check the output - you should see:
```
✅ SYNC COMPLETE!
📊 Summary:
   Tournaments Synced: 2-3
   Golfers Added: 150-300 (depending on tournaments)
```

### Step 3: Test Team Builder
1. Go to golf app: http://localhost:3001
2. Navigate to upcoming tournament
3. Click "Build Team" or "Register"
4. **Verify golfers appear in team builder**

### Step 4: Set Up Production Cron (Deploy to Vercel)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-tournament-golfers",
    "schedule": "0 6 * * *"
  }]
}
```

Or use external cron service:
```bash
# Daily at 6 AM
curl -X POST https://your-domain.com/api/cron/sync-tournament-golfers \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## API Endpoint Details

### POST /api/cron/sync-tournament-golfers

**Authorization:** Bearer token (CRON_SECRET environment variable)

**Response:**
```json
{
  "success": true,
  "syncedTournaments": 2,
  "skippedTournaments": 1,
  "errors": [],
  "details": [
    {
      "tournamentId": "abc-123",
      "tournamentName": "RSM Classic",
      "status": "synced",
      "golfersAdded": 156,
      "message": "Successfully added 156 golfers"
    }
  ]
}
```

## Monitoring & Maintenance

### Check Tournament Golfers
```sql
-- See which tournaments have golfers
SELECT 
  t.name,
  t.start_date,
  COUNT(tg.id) as golfer_count
FROM tournaments t
LEFT JOIN tournament_golfers tg ON tg.tournament_id = t.id
WHERE t.status = 'upcoming'
GROUP BY t.id, t.name, t.start_date
ORDER BY t.start_date;
```

### Manual Sync Individual Tournament
```bash
POST /api/tournaments/{tournament_id}/sync-golfers
Body: { "tour": "pga", "replace": false }
```

## Why This Matters
Without golfers in `tournament_golfers`:
- ❌ Team builder shows empty
- ❌ Users can't register for competitions
- ❌ No salary data for fantasy lineups
- ❌ Tournament becomes unplayable

With automated sync:
- ✅ Golfers populate 6 days before start
- ✅ Users have time to build teams
- ✅ Registration opens smoothly
- ✅ No manual intervention needed

## Testing Checklist

- [ ] Run emergency sync script
- [ ] Verify tournaments have golfers in database
- [ ] Check team builder loads players
- [ ] Test registration flow
- [ ] Confirm salaries are assigned
- [ ] Set up production cron job
- [ ] Monitor first automated run

## Environment Variables Required

```env
# Admin app (.env)
DATAGOLF_API_KEY=your_datagolf_key
CRON_SECRET=your_secure_random_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### "No field data available from DataGolf"
- Check DATAGOLF_API_KEY is valid
- Verify tournament is in DataGolf's current schedule
- Try different tour parameter (pga/euro)

### "Unauthorized - Invalid cron secret"
- Set CRON_SECRET environment variable
- Use same secret in cron caller

### Golfers created but not showing in team builder
- Check `tournament_golfers` table has entries
- Verify `golfer_id` matches `golfers.id`
- Check team builder API endpoint

## Next Tournament Schedule
After fixing, sync should happen automatically:
- **6 days before:** Cron syncs golfers
- **1 day before:** Registration opens (ready!)
- **Tournament start:** Live scoring begins

---

**Status:** ✅ SOLUTION READY - Run emergency script now!
**Priority:** 🚨 CRITICAL - Blocking user registrations
**Time to Fix:** 2-3 minutes to run script

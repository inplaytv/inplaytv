# Tournament Lifecycle Management System

## Overview
Automated tournament status management system that updates tournament statuses every 2 minutes based on registration and start/end dates.

## Tournament Status Lifecycle

```
Upcoming → Registration Open → Registration Closed → Live In-Play → Completed
                                                            ↓
                                                        Cancelled
```

### Status Definitions

1. **Upcoming** - Tournament scheduled but registration hasn't opened yet
2. **Registration Open** - Players can register/enter the tournament  
3. **Registration Closed** - Registration period ended, tournament starting soon
4. **Live In-Play** - Tournament is currently being played
5. **Completed** - Tournament finished
6. **Cancelled** - Tournament cancelled (manual override only)

## Automatic Status Transitions

The system automatically updates statuses based on these rules:

| Current Status | Transitions To | When |
|---|---|---|
| Upcoming | Registration Open | Now >= registration_open_date |
| Registration Open | Registration Closed | Now >= registration_close_date |
| Registration Closed | Live In-Play | Now >= start_date |
| Live In-Play | Completed | Now >= end_date |
| Cancelled | Cancelled | Never changes automatically |

## Database Setup

### 1. Run Migration

Execute `scripts/2025-01-tournament-lifecycle.sql` in Supabase SQL Editor:

```bash
# File adds:
- registration_open_date column
- registration_close_date column
- New status values
- Automatic update function
- Indexes for performance
```

### 2. New Columns

| Column | Type | Required | Description |
|---|---|---|---|
| `registration_open_date` | TIMESTAMPTZ | Yes | When registration opens |
| `registration_close_date` | TIMESTAMPTZ | Yes | When registration closes |

**Example Values:**
- Registration opens 30 days before tournament
- Registration closes 1 hour before start

## API Endpoints

### Update All Statuses (POST)
```
POST /api/tournaments/update-statuses
Headers: Authorization: Bearer YOUR_CRON_SECRET
```

Triggers automatic status update for all tournaments.

**Response:**
```json
{
  "success": true,
  "message": "Tournament statuses updated successfully",
  "timestamp": "2025-10-30T14:30:00Z",
  "tournaments": [...]
}
```

### Check Status (GET)
```
GET /api/tournaments/update-statuses
```

Returns current tournament statuses without updating.

### CSV Import (POST)
```
POST /api/tournaments/import-csv
Body: { "tournaments": [...] }
```

Bulk import tournaments from CSV data.

## CSV Import Format

### Required Columns
- `name` - Tournament name
- `slug` - URL-friendly identifier (e.g., "the-masters-2025")
- `start_date` - Tournament start (ISO 8601 format)
- `end_date` - Tournament end (ISO 8601 format)
- `registration_open_date` - When registration opens
- `registration_close_date` - When registration closes

### Optional Columns
- `description` - Tournament description
- `location` - Venue/location
- `timezone` - Timezone (default: "Europe/London")
- `status` - Initial status (default: "upcoming")
- `image_url` - Banner image URL
- `external_id` - External system ID (e.g., PGA Tour ID)

### Example CSV

See `docs/tournament-import-template.csv`:

```csv
name,slug,start_date,end_date,registration_open_date,registration_close_date,location
The Masters 2025,the-masters-2025,2025-04-10T08:00:00Z,2025-04-13T18:00:00Z,2025-03-11T00:00:00Z,2025-04-10T07:00:00Z,Augusta National
```

### Date Format
Use ISO 8601:
- `YYYY-MM-DDTHH:MM:SSZ` (recommended)
- `YYYY-MM-DD HH:MM:SS`

## Admin UI Features

### Auto-Refresh
- **Enabled by default**
- Updates every **2 minutes**
- Toggle on/off with checkbox
- Shows last update time

### Manual Refresh
- Click "🔄 Refresh Statuses" button
- Immediately updates all tournament statuses
- Reloads tournament list

### CSV Import
1. Click "📤 Import CSV"
2. Select CSV file
3. Review format requirements
4. Click "Import Tournaments"
5. System validates and imports
6. Statuses automatically updated after import

### Status Badges
Color-coded status indicators:
- 🔵 **Blue** - Upcoming
- 🟢 **Green** - Registration Open
- 🟡 **Amber** - Registration Closed
- 🔴 **Red** - Live In-Play
- 🟣 **Purple** - Completed
- ⚫ **Gray** - Cancelled

## Cron Job Setup

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/tournaments/update-statuses",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use cron-job.org or similar:

```bash
# URL: https://your-admin-domain.com/api/tournaments/update-statuses
# Method: POST
# Schedule: */2 * * * * (every 2 minutes)
# Headers: Authorization: Bearer YOUR_CRON_SECRET
```

### Option 3: GitHub Actions

Create `.github/workflows/update-tournaments.yml`:

```yaml
name: Update Tournament Statuses
on:
  schedule:
    - cron: '*/2 * * * *'
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Update
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-admin-domain.com/api/tournaments/update-statuses
```

## Environment Variables

Add to `.env.local`:

```bash
# Optional: Secure cron endpoint
CRON_SECRET_KEY=your-secret-key-here

# Existing variables
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Testing

### 1. Test Status Updates
```bash
curl -X POST \
  -H "Authorization: Bearer your-secret" \
  http://localhost:3002/api/tournaments/update-statuses
```

### 2. Test CSV Import
1. Go to http://localhost:3002/tournaments
2. Click "📤 Import CSV"
3. Upload `docs/tournament-import-template.csv`
4. Verify tournaments imported
5. Check statuses auto-updated

### 3. Test Auto-Refresh
1. Create tournament with dates in past/future
2. Enable auto-refresh
3. Wait 2 minutes
4. Verify status updated

## Manual Status Override

Admins can manually change status:
1. Go to Edit Tournament page
2. Change status dropdown
3. Save tournament
4. Status won't auto-update to **Cancelled** status

## Troubleshooting

### Statuses Not Updating

**Check:**
1. Migration ran successfully
2. Cron job is running
3. Auto-refresh is enabled
4. Dates are in correct timezone

**Fix:**
```sql
-- Manually trigger update
SELECT update_tournament_status();
```

### CSV Import Failing

**Common Issues:**
- Wrong date format → Use ISO 8601
- Missing required columns → Check template
- Duplicate slug → Use unique slugs
- Binary/Excel data → Save as actual CSV

### Auto-Refresh Not Working

**Check:**
1. Browser console for errors
2. Network tab for API calls
3. CRON_SECRET_KEY matches

## Best Practices

1. **Set Realistic Dates**
   - Registration opens 30 days before
   - Registration closes 1-24 hours before start
   
2. **Use Timezones**
   - Set correct timezone for each tournament
   - Dates auto-convert for users

3. **Test Before Production**
   - Import test tournaments
   - Verify status transitions
   - Check auto-refresh works

4. **Monitor Logs**
   - Check Vercel/server logs
   - Verify cron job runs
   - Watch for errors

## Architecture

```
┌─────────────────┐
│  Admin UI       │
│  - Auto-refresh │
│  - CSV Import   │
│  - Manual Edit  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │
│  - Update       │
│  - Import       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  - Function     │
│  - RLS Policies │
│  - Triggers     │
└─────────────────┘
         ▲
         │
┌────────┴────────┐
│  Cron Job       │
│  Every 2 min    │
└─────────────────┘
```

## Files Modified/Created

### New Files
- `apps/admin/src/lib/tournament-lifecycle.ts` - Status constants and logic
- `apps/admin/src/app/api/tournaments/update-statuses/route.ts` - Status update API
- `apps/admin/src/app/api/tournaments/import-csv/route.ts` - CSV import API
- `scripts/2025-01-tournament-lifecycle.sql` - Database migration
- `docs/tournament-import-template.csv` - CSV template example
- `docs/TOURNAMENT-LIFECYCLE.md` - This documentation

### Modified Files
- `apps/admin/src/app/tournaments/TournamentsList.tsx` - Added UI controls

## Success Criteria

✅ Tournaments auto-update every 2 minutes
✅ CSV import works for bulk tournaments
✅ Status badges show correct colors
✅ Manual refresh button works
✅ Auto-refresh can be toggled
✅ Statuses transition correctly based on dates
✅ System is reliable and robust

## Future Enhancements

- Email notifications on status changes
- Webhook support for external systems
- Bulk status override
- Status change history/audit log
- Dashboard showing upcoming status changes
- Integration with PGA Tour API for automatic tournament creation

---

**System Status:** ✅ Production Ready

**Last Updated:** October 30, 2025

# 🎯 Tournament Lifecycle Manager - Enhanced Edition

## ✨ What's New

The Tournament Lifecycle Manager now includes **automated status transitions** and **real-time countdown timers** with dual timezone support, making tournament management fully automated and reliable.

### New Features

#### 1. **Live Countdown Timers** ⏱️
- Real-time countdown to next phase (registration opens, closes, tournament starts/ends)
- Updates every second for accurate timing
- Color-coded based on tournament status
- Shows exactly what's counting down (registration, tournament start, etc.)

#### 2. **Dual Timezone Clocks** 🌍
- **Your Time**: Shows admin's local timezone
- **Tournament Time**: Shows tournament's timezone (EST, PST, etc.)
- Both clocks update every second
- Automatic timezone detection and display

#### 3. **Automated Status Transitions** 🤖
- Automatically opens registration when `registration_opens_at` is reached
- Automatically closes registration when `registration_closes_at` is reached
- Automatically starts tournament when `start_date` is reached
- Suggests completion when `end_date` is reached (manual completion for safety)
- Validates prerequisites (golfers, competitions) before transitioning
- Runs every 5 minutes via Windows Task Scheduler

#### 4. **Enhanced Visual Design** 🎨
- Glassmorphic cards with dark theme
- Color-coded countdown timers (blue, green, yellow, purple, red)
- Warning indicators for missing golfers/competitions
- Status badges with distinct colors
- Clean, modern interface

## 🚀 Getting Started

### Prerequisites
- Admin app running on port 3002 (`pnpm dev:admin`)
- Database columns `registration_opens_at` and `registration_closes_at` added to tournaments table
- Windows Task Scheduler (for automated transitions)

### Setup Automated Transitions

Run this command to set up the automation:

```powershell
.\scripts\setup-auto-transition.ps1
```

This will:
1. Create a PowerShell runner script
2. Register a Windows Task Scheduler task
3. Configure it to run every 5 minutes
4. Set up logging to `scripts/auto-transition.log`

### Manual Testing

Test the auto-transition endpoint manually:

```powershell
.\scripts\test-auto-transition.ps1
```

## 📊 Dashboard Features

### Tournament Cards

Each tournament card displays:

1. **Header**
   - Tournament name with status icon
   - Timezone and timing information
   - Color-coded status badge

2. **Live Countdown Timer**
   - Dynamic countdown to next phase
   - Color-coded border matching status
   - Examples:
     - `📝 Reg Opens in: 2d 5h 30m`
     - `🔒 Reg Closes in: 5h 23m 45s`
     - `🏌️ Tournament Starts in: 15m 30s`
     - `🏁 Tournament Ends in: 1d 2h 15m`
     - `⚠️ Should be Completed` (if past end date)

3. **Dual Timezone Clocks**
   - Your local time (auto-detected)
   - Tournament time (from tournament.timezone)
   - Both update every second
   - Timezone names displayed

4. **Tournament Dates**
   - Start and end dates
   - Registration window (if set)
   - All times shown in tournament timezone

5. **Statistics**
   - Golfer count
   - Competition count
   - Entry count
   - ⚠️ Warnings if prerequisites missing

6. **Action Buttons**
   - Change Status (manual override)
   - Set Registration (set windows)

## 🤖 Automated Status Transitions

### How It Works

The auto-transition system checks every 5 minutes and:

1. **Opens Registration**
   - When: `registration_opens_at` timestamp is reached
   - Validation: Tournament must have golfers assigned
   - Transition: `upcoming` → `registration_open`

2. **Closes Registration**
   - When: `registration_closes_at` timestamp is reached
   - Action: Prevents new entries
   - Next: Waits for tournament start or goes to `in_progress` if already started

3. **Starts Tournament**
   - When: `start_date` timestamp is reached
   - Validation: Tournament must have competitions created
   - Transition: `upcoming` or `registration_open` → `in_progress`

4. **Suggests Completion**
   - When: `end_date` timestamp is reached
   - Action: Shows warning on dashboard
   - Note: Does NOT auto-complete for safety (manual completion recommended)

### Validation Rules

Status transitions are validated:

- ✅ **upcoming → registration_open**: Requires golfers
- ✅ **registration_open → in_progress**: Requires competitions
- ✅ **Any → cancelled**: Always allowed
- ✅ **in_progress → completed**: Manual only (for safety)

### Logging

All transitions are logged to `scripts/auto-transition.log`:

```
[2024-01-15 14:30:00] Running auto-transition check...
[2024-01-15 14:30:02] ✅ Success: Checked 5 tournaments, 1 transitions, 0 failures
  ✓ BMW Australian Open: upcoming → registration_open (Registration window opened)
```

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Upcoming | Gray `#6b7280` | Tournament created, not yet open |
| Registration Open | Green `#10b981` | Users can register |
| In Progress | Blue `#3b82f6` | Tournament started, live scoring |
| Completed | Purple `#8b5cf6` | Tournament finished |
| Cancelled | Red `#ef4444` | Tournament cancelled |

## 🔧 Management

### View Scheduled Task

```powershell
Get-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition"
```

### Run Task Manually

```powershell
Start-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition"
```

### View Logs

```powershell
Get-Content .\scripts\auto-transition.log -Tail 50
```

### Disable Auto-Transitions

```powershell
Disable-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition"
```

### Enable Auto-Transitions

```powershell
Enable-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition"
```

### Remove Task

```powershell
Unregister-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition" -Confirm:$false
```

## 📡 API Endpoints

### GET /api/tournament-lifecycle
Fetches all tournaments with counts

**Response:**
```json
{
  "tournaments": [
    {
      "id": "...",
      "name": "BMW Australian Open",
      "status": "registration_open",
      "start_date": "2024-01-18T00:00:00Z",
      "end_date": "2024-01-21T23:59:59Z",
      "registration_opens_at": "2024-01-15T12:00:00Z",
      "registration_closes_at": "2024-01-18T00:00:00Z",
      "timezone": "Australia/Melbourne",
      "golfer_count": 156,
      "competition_count": 8,
      "entry_count": 42
    }
  ]
}
```

### POST /api/tournament-lifecycle/[id]/status
Manually change tournament status

**Request:**
```json
{
  "status": "registration_open"
}
```

### POST /api/tournament-lifecycle/[id]/registration
Set registration windows

**Request:**
```json
{
  "registration_opens_at": "2024-01-15T12:00:00Z",
  "registration_closes_at": "2024-01-18T00:00:00Z"
}
```

### POST /api/tournament-lifecycle/auto-transition
Trigger automated status check (called by cron)

**Headers:**
```
Authorization: Bearer YOUR_SECRET_TOKEN
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T14:30:00Z",
  "checked": 5,
  "transitioned": 1,
  "failed": 0,
  "transitions": [
    {
      "tournamentId": "...",
      "tournamentName": "BMW Australian Open",
      "fromStatus": "upcoming",
      "toStatus": "registration_open",
      "reason": "Registration window opened",
      "success": true
    }
  ]
}
```

## 🔐 Security

### Production Setup

For production, protect the auto-transition endpoint:

1. Set environment variable:
```env
CRON_SECRET_TOKEN=your_secure_random_token_here
```

2. Update runner script to include token:
```powershell
$headers = @{ 'Authorization' = 'Bearer your_secure_random_token_here' }
$response = Invoke-RestMethod -Uri $endpoint -Method POST -Headers $headers
```

## 📁 File Structure

```
apps/admin/src/
├── app/
│   ├── tournament-lifecycle/
│   │   ├── page.tsx                    # Enhanced UI with countdowns
│   │   └── TournamentLifecycle.module.css
│   └── api/
│       └── tournament-lifecycle/
│           ├── route.ts                # GET tournaments
│           ├── auto-transition/
│           │   └── route.ts            # NEW: Auto-transition handler
│           └── [id]/
│               ├── status/
│               │   └── route.ts        # POST status change
│               └── registration/
│                   └── route.ts        # POST registration windows

scripts/
├── setup-auto-transition.ps1           # NEW: Setup automation
├── test-auto-transition.ps1            # NEW: Manual testing
├── run-auto-transition.ps1             # NEW: Generated runner script
└── auto-transition.log                 # NEW: Transition logs
```

## ✅ Benefits

### Reliability
- ✅ No more manual status changes
- ✅ Automatic validation before transitions
- ✅ Comprehensive error logging
- ✅ Manual override always available

### Transparency
- ✅ Real-time countdown shows exactly when transitions will occur
- ✅ Dual timezone support prevents confusion
- ✅ Color-coded visual indicators
- ✅ Detailed transition logs

### Efficiency
- ✅ Runs automatically every 5 minutes
- ✅ No admin intervention needed
- ✅ Validates prerequisites automatically
- ✅ Warns about issues before they become problems

## 🎯 Best Practices

1. **Set Registration Windows Early**
   - Configure registration windows when creating tournament
   - Ensure they align with tournament timezone
   - Close registration before tournament starts

2. **Monitor Warnings**
   - Dashboard shows warnings for missing golfers/competitions
   - Fix issues before registration opens
   - Check logs regularly for failed transitions

3. **Test Transitions**
   - Use `test-auto-transition.ps1` to preview transitions
   - Create test tournaments to verify behavior
   - Check logs after setting up new tournaments

4. **Manual Completion**
   - Always complete tournaments manually
   - Verify final scores before completing
   - Auto-completion is disabled for safety

## 🚨 Troubleshooting

### Auto-transitions not working?

1. **Check if admin app is running**
   ```powershell
   # Should show process on port 3002
   Get-NetTCPConnection -LocalPort 3002 -State Listen
   ```

2. **Check scheduled task**
   ```powershell
   Get-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition" | Select-Object State, LastRunTime, LastTaskResult
   ```

3. **View logs**
   ```powershell
   Get-Content .\scripts\auto-transition.log -Tail 50
   ```

4. **Run manually**
   ```powershell
   .\scripts\test-auto-transition.ps1
   ```

### Countdown timer not showing?

- Check that tournament has registration windows or start/end dates
- Refresh the page (countdowns start on page load)
- Check browser console for errors

### Timezone display incorrect?

- Verify tournament.timezone is set correctly in database
- Format should be: `America/New_York`, `Australia/Melbourne`, etc.
- Check [IANA timezone database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## 🎉 Success Metrics

- ✅ Real-time countdown timers on all tournament cards
- ✅ Dual timezone clocks updating every second
- ✅ Automated status transitions every 5 minutes
- ✅ Validation prevents invalid transitions
- ✅ Comprehensive logging and monitoring
- ✅ Clean, modern UI with color-coded indicators
- ✅ Zero manual intervention needed for standard tournaments

## 📝 Notes

- Countdown timers update every second (smooth, real-time)
- Status checks run every 5 minutes (efficient, reliable)
- Tournament completion requires manual confirmation (safety)
- All times respect tournament timezone settings
- Logs rotate automatically (older entries at bottom)

---

**Built with**: Next.js 16, React 19, TypeScript, Supabase, Windows Task Scheduler
**Last Updated**: January 2024

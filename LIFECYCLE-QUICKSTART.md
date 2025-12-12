# 🚀 Quick Start - Tournament Lifecycle Manager

## Get Running in 2 Minutes

### Step 1: Start Admin App
```powershell
pnpm dev:admin
```

### Step 2: Open Dashboard
Visit: http://localhost:3003/tournament-lifecycle

You'll see:
- All tournaments with live countdown timers
- Dual timezone clocks updating every second
- Color-coded status badges
- Statistics (golfers, competitions, entries)

### Step 3: Setup Automation (Optional)
```powershell
.\scripts\setup-auto-transition.ps1
```

This creates a Windows Task Scheduler job that runs every 5 minutes to automatically transition tournament statuses.

### Step 4: Test It (Optional)
```powershell
.\scripts\test-auto-transition.ps1
```

## What You'll See

### Dashboard Example
```
🔄 Tournament Lifecycle Manager                    [🔄 Refresh]
───────────────────────────────────────────────────────────────

┌──────────────────────────────────────┐
│ 🔜 BMW Australian Open               │
│                     [    UPCOMING    ]│
│                                       │
│ ┌───────────────────────────────────┐│
│ │ 📝 Reg Opens in: 2d 5h 30m        ││
│ └───────────────────────────────────┘│
│                                       │
│ YOUR TIME       │ TOURNAMENT TIME     │
│ 14:23:45        │ 00:23:45            │
│ Los Angeles     │ Melbourne           │
│                                       │
│ 156 Golfers  8 Comps  42 Entries     │
│                                       │
│ [Change Status] [Set Registration]   │
└──────────────────────────────────────┘
```

## Key Features

### ⏱️ Live Countdown Timers
- Updates every second
- Shows next milestone (reg opens, closes, start, end)
- Color-coded borders

### 🌍 Dual Timezone Clocks
- Your local time
- Tournament timezone
- Both update in real-time

### 🤖 Automated Transitions
Status changes happen automatically:
- ✅ Opens registration at specified time
- ✅ Closes registration at specified time  
- ✅ Starts tournament at start_date
- ✅ Suggests completion at end_date

### ⚠️ Smart Validation
- Won't open registration without golfers
- Won't start tournament without competitions
- Shows warnings on dashboard
- Logs all validation failures

## Manual Controls

### Change Status
Click "Change Status" button to manually override:
- Upcoming
- Registration Open
- In Progress
- Completed
- Cancelled

### Set Registration Windows
Click "Set Registration" to configure:
- Registration opens at (date/time)
- Registration closes at (date/time)
- Both respect tournament timezone

## Monitoring

### View Auto-Transition Logs
```powershell
Get-Content .\scripts\auto-transition.log -Tail 50
```

### Check Scheduled Task
```powershell
Get-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition"
```

### Run Task Manually
```powershell
Start-ScheduledTask -TaskName "InPlayTV-Tournament-Auto-Transition"
```

## Troubleshooting

### Dashboard not loading?
```powershell
# Check admin app is running on port 3003
Get-NetTCPConnection -LocalPort 3003 -State Listen
```

### Countdown not showing?
- Refresh the page
- Check tournament has start_date/end_date
- Check browser console for errors

### Auto-transitions not working?
```powershell
# Test the endpoint manually
.\scripts\test-auto-transition.ps1
```

## Status Flow

```
UPCOMING
  ↓ (registration_opens_at reached)
REGISTRATION OPEN
  ↓ (registration_closes_at reached)
UPCOMING or IN PROGRESS
  ↓ (start_date reached)
IN PROGRESS
  ↓ (manual: end_date reached)
COMPLETED
```

## That's It!

Your tournament lifecycle is now fully automated with beautiful real-time UI. 

**Need more details?** See:
- `TOURNAMENT-LIFECYCLE-ENHANCED.md` - Full documentation
- `LIFECYCLE-VISUAL-GUIDE.md` - Visual examples
- `LIFECYCLE-BUILD-COMPLETE.md` - Technical details

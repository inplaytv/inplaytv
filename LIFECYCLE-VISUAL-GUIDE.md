# 🎯 Tournament Lifecycle Manager - Visual Guide

## Enhanced Dashboard View

### Tournament Card Example

```
┌─────────────────────────────────────────────────────────────┐
│ 🔜 BMW Australian Open         [    UPCOMING    ]          │
│ Australia/Melbourne • 5d away                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌───────────────────────────────────────────────────────┐  │
│ │  📝 Reg Opens in: 2d 5h 30m                           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─────────────────────────┬─────────────────────────────┐  │
│ │    YOUR TIME            │    TOURNAMENT TIME          │  │
│ │    14:23:45             │    00:23:45                 │  │
│ │    Los Angeles          │    Melbourne                │  │
│ └─────────────────────────┴─────────────────────────────┘  │
│                                                               │
│ 🏌️ Tournament: Dec 14, 2024 - Dec 17, 2024                 │
│ 📝 Reg Opens: Dec 10, 2024 16:00 (Melbourne)                │
│ 🔒 Reg Closes: Dec 14, 2024 00:00 (Melbourne)               │
│                                                               │
│ ┌────────────┬────────────┬────────────┐                    │
│ │     156    │      8     │     42     │                    │
│ │   Golfers  │ Comps      │  Entries   │                    │
│ └────────────┴────────────┴────────────┘                    │
│                                                               │
│ [ Change Status ]  [ Set Registration ]                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Status Progression with Countdowns

#### 1. Upcoming Tournament (Registration Not Open)
```
Status: UPCOMING (Gray)
Countdown: 📝 Reg Opens in: 2d 5h 30m
```

#### 2. Registration Open
```
Status: REGISTRATION OPEN (Green)
Countdown: 🔒 Reg Closes in: 3d 15h 45m
```

#### 3. Registration Closing Soon
```
Status: REGISTRATION OPEN (Green)
Countdown: 🔒 Reg Closes in: 2h 30m 15s
```

#### 4. Awaiting Tournament Start
```
Status: UPCOMING (Gray)
Countdown: 🏌️ Tournament Starts in: 5h 23m 45s
```

#### 5. Tournament In Progress
```
Status: IN PROGRESS (Blue)
Countdown: 🏁 Tournament Ends in: 1d 2h 15m
```

#### 6. Tournament Past End Time
```
Status: IN PROGRESS (Blue)
Countdown: ⚠️ Should be Completed
```

#### 7. Tournament Completed
```
Status: COMPLETED (Purple)
Countdown: ✅ Completed
```

## Color Coding

### Status Badges
- **Gray** `#6b7280` - Upcoming
- **Green** `#10b981` - Registration Open
- **Blue** `#3b82f6` - In Progress
- **Purple** `#8b5cf6` - Completed
- **Red** `#ef4444` - Cancelled

### Countdown Timers
- **Gray border** - Upcoming (waiting for registration)
- **Green border** - Registration open (active registration)
- **Blue border** - In progress (tournament live)
- **Purple border** - Completed
- **Red border** - Cancelled

## Dual Timezone Clocks

### Layout
```
┌─────────────────────────┬─────────────────────────────┐
│      YOUR TIME          │    TOURNAMENT TIME          │
│ ───────────────────     │ ───────────────────         │
│      14:23:45           │        00:23:45             │
│   Los Angeles           │      Melbourne              │
└─────────────────────────┴─────────────────────────────┘
```

### Updates
- Both clocks update every second
- No page refresh needed
- Synchronized timing
- Automatic timezone detection

## Automated Transitions Timeline

```
Timeline View:

Dec 10, 16:00 (Tournament Time)
│
├── 📝 AUTO: Registration Opens
│   └── Status: upcoming → registration_open
│   └── Validation: Checks for golfers
│
│
Dec 14, 00:00 (Tournament Time)
│
├── 🔒 AUTO: Registration Closes
│   └── Status: registration_open → upcoming
│   └── Action: No new entries allowed
│
│
Dec 14, 07:00 (Tournament Time)
│
├── 🏌️ AUTO: Tournament Starts
│   └── Status: upcoming → in_progress
│   └── Validation: Checks for competitions
│
│
Dec 17, 23:59 (Tournament Time)
│
├── 🏁 MANUAL: Tournament Completes
│   └── Status: in_progress → completed
│   └── Action: Admin clicks "Change Status"
│   └── Reason: Manual completion for safety
│
```

## Auto-Transition Log Output

```powershell
PS> .\scripts\test-auto-transition.ps1

🔄 Testing auto-transition endpoint...
Endpoint: http://localhost:3002/api/tournament-lifecycle/auto-transition

📋 Endpoint Info:
{
  "endpoint": "Auto-Transition Handler",
  "method": "POST",
  "description": "Automatically transitions tournament statuses..."
}

🚀 Running auto-transition check...

✅ Success!
  Timestamp: 2024-01-15T14:30:00Z
  Tournaments Checked: 5
  Successful Transitions: 1
  Failed Transitions: 0

📝 Transition Details:
  ✓ BMW Australian Open
    Status: upcoming → registration_open
    Reason: Registration window opened

  ✓ Alfred Dunhill Championship
    Status: registration_open → in_progress
    Reason: Tournament start time reached
```

## Warning Indicators

### Missing Golfers
```
┌─────────────────────────────────────────────────────────────┐
│ 🔜 Test Tournament             [    UPCOMING    ]           │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ No golfers assigned                                       │
│                                                               │
│ ┌────────────┬────────────┬────────────┐                    │
│ │      0 ⚠️  │      8     │     0      │                    │
│ │   Golfers  │ Comps      │  Entries   │                    │
│ └────────────┴────────────┴────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Missing Competitions
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Test Tournament        [ REGISTRATION OPEN ]             │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ No competitions created                                   │
│                                                               │
│ ┌────────────┬────────────┬────────────┐                    │
│ │     156    │      0 ⚠️  │     12     │                    │
│ │   Golfers  │ Comps      │  Entries   │                    │
│ └────────────┴────────────┴────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## Dashboard Header

```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Tournament Lifecycle Manager           [ 🔄 Refresh ]    │
│ Automated status transitions • Timezone-aware registration  │
│ Real-time monitoring                                         │
├─────────────────────────────────────────────────────────────┤
│ Status Legend:                                               │
│ ● Upcoming - Tournament created                              │
│ ● Registration Open - Users can register                     │
│ ● In Progress - Tournament started                           │
│ ● Completed - Results finalized                              │
└─────────────────────────────────────────────────────────────┘
```

## Modal: Change Status

```
┌─────────────────────────────────────────────────────────────┐
│ Change Tournament Status                              [  ×  ]│
├─────────────────────────────────────────────────────────────┤
│ BMW Australian Open                                          │
│ Current: upcoming                                            │
│                                                               │
│ ◉ Upcoming                                                   │
│   Tournament created, registration not yet open              │
│                                                               │
│ ○ Registration Open                                          │
│   Users can register and build teams                         │
│                                                               │
│ ○ In Progress                                                │
│   Tournament has started, no new entries                     │
│                                                               │
│ ○ Completed                                                  │
│   Tournament finished, results finalized                     │
│                                                               │
│ ○ Cancelled                                                  │
│   Tournament cancelled, entries refunded                     │
│                                                               │
│                              [ Cancel ]  [ Update Status ]   │
└─────────────────────────────────────────────────────────────┘
```

## Modal: Set Registration

```
┌─────────────────────────────────────────────────────────────┐
│ Set Registration Windows                              [  ×  ]│
├─────────────────────────────────────────────────────────────┤
│ BMW Australian Open                                          │
│ Timezone: Australia/Melbourne                                │
│                                                               │
│ Registration Opens At                                        │
│ [2024-12-10T16:00                                    ]      │
│ When users can start registering for this tournament         │
│                                                               │
│ Registration Closes At                                       │
│ [2024-12-14T00:00                                    ]      │
│ When registration closes (typically before tournament)       │
│                                                               │
│                    [ Cancel ]  [ Save Registration Windows ] │
└─────────────────────────────────────────────────────────────┘
```

## Mobile View (Responsive)

```
┌─────────────────────────────┐
│ 🔄 Tournament Lifecycle     │
│                             │
│ [ 🔄 Refresh ]              │
├─────────────────────────────┤
│ 🔜 BMW Australian Open      │
│ [    UPCOMING    ]          │
│                             │
│ 📝 Reg Opens in: 2d 5h 30m  │
│                             │
│ YOUR TIME     │ TOURN TIME  │
│ 14:23:45      │ 00:23:45    │
│ LA            │ Melbourne   │
│                             │
│ 🏌️ Dec 14-17, 2024          │
│                             │
│ 156 Golfers                 │
│ 8 Competitions              │
│ 42 Entries                  │
│                             │
│ [ Change Status ]           │
│ [ Set Registration ]        │
└─────────────────────────────┘
```

## Desktop View (Full Width)

```
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ 🔜 BMW Australian Open   │ 📝 Alfred Dunhill Champ  │ ⛳ The RSM Classic       │
│ [    UPCOMING    ]       │ [ REGISTRATION OPEN ]    │ [   IN PROGRESS   ]      │
│                          │                          │                          │
│ 📝 Reg Opens: 2d 5h 30m  │ 🔒 Reg Closes: 1d 2h 15m │ 🏁 Ends: 5h 30m 12s     │
│                          │                          │                          │
│ YOUR │ TOURNAMENT         │ YOUR │ TOURNAMENT         │ YOUR │ TOURNAMENT        │
│ 14:23│ 00:23             │ 14:23│ 02:23             │ 14:23│ 09:23            │
│ LA   │ Melbourne         │ LA   │ S Africa          │ LA   │ New York         │
│                          │                          │                          │
│ 156 Golfers              │ 144 Golfers              │ 132 Golfers             │
│ 8 Competitions           │ 6 Competitions           │ 10 Competitions          │
│ 42 Entries               │ 89 Entries               │ 156 Entries             │
│                          │                          │                          │
│ [Change] [Set Reg]       │ [Change] [Set Reg]       │ [Change] [Set Reg]       │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

---

**Visual Theme**: Dark mode with glassmorphic cards, vibrant status colors, real-time animations

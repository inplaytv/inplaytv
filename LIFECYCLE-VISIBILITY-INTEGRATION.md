# Lifecycle Manager & Visibility System Integration

## ✅ YES - Fully Integrated!

The Lifecycle Manager is the **source of truth** for tournament timing, and it **automatically syncs** with the visibility safeguards.

## 🔄 The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN: Lifecycle Manager                                        │
│ (apps/admin/src/app/tournament-lifecycle/)                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 1. Admin sets registration dates & round tee times
                  │    - registration_opens_at
                  │    - registration_closes_at  
                  │    - round_1_start, round_2_start, etc.
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ API: Save Registration Times                                     │
│ /api/tournament-lifecycle/[id]/registration (POST)              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 2. Saves to tournaments table
                  │ 3. AUTO-CALLS calculate-times API ✨
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ API: Calculate Competition Times                                 │
│ /api/tournaments/[id]/competitions/calculate-times (POST)        │
│                                                                  │
│ Logic:                                                           │
│ FOR EACH competition:                                            │
│   - Get competition_types.round_start (which round it starts)   │
│   - Get round_N_start from tournament (tee time for that round) │
│   - Calculate: reg_close_at = round_start - 15 minutes          │
│   - Set status based on current time vs dates                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 4. Updates tournament_competitions table
                  │    - Sets reg_open_at = tournament.registration_opens_at
                  │    - Sets reg_close_at = round_start - 15min
                  │    - Sets status = 'reg_open' | 'live' | 'upcoming'
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: tournament_competitions table                          │
│ Now has ACCURATE date-based timing for each competition         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 5. Frontend fetches tournaments
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ PLAYER: Tournaments Page                                         │
│ (apps/golf/src/app/tournaments/page.tsx)                        │
│                                                                  │
│ Uses: isTournamentVisible() ✨                                  │
│   → Checks isCompetitionVisible() for each competition          │
│     → Calls isRegistrationOpen(reg_open_at, reg_close_at)      │
│       → Compares CURRENT TIME vs reg_close_at                   │
│       → IGNORES status field! ✅                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Integration Points

### 1. Lifecycle Manager Sets Dates
**File:** `apps/admin/src/app/api/tournament-lifecycle/[id]/registration/route.ts`

**Line 156-170:** After saving registration dates, automatically calls:
```typescript
const calculateUrl = `${baseUrl}/api/tournaments/${params.id}/competitions/calculate-times`;
const calculateRes = await fetch(calculateUrl, { method: 'POST' });
```

### 2. Calculate-Times Syncs Competitions
**File:** `apps/admin/src/app/api/tournaments/[id]/competitions/calculate-times/route.ts`

**Line 30-55:** For each competition:
```typescript
const roundStart = competition_types.round_start; // e.g., 1 for Round 1
const teeTime = tournament.round_1_start; // From Lifecycle Manager!
const regCloseAt = new Date(teeTime - 15_MINUTES);

await supabase.from('tournament_competitions').update({
  reg_open_at: tournament.registration_opens_at,  // From Lifecycle ✅
  reg_close_at: regCloseAt.toISOString(),        // Calculated ✅
  start_at: teeTime,
  status: now >= regCloseAt ? 'live' : 'reg_open'
});
```

### 3. Frontend Uses Date-Based Logic
**File:** `apps/golf/src/lib/unified-competition.ts`

**Line 447-456:** Checks dates ONLY:
```typescript
export function isRegistrationOpen(regOpenAt, regCloseAt): boolean {
  const now = new Date();
  if (regOpenAt && now < new Date(regOpenAt)) return false;  // Not opened
  if (regCloseAt && now >= new Date(regCloseAt)) return false; // Closed
  return true; // Open by date!
}
```

## 🔐 Safeguards In Place

### 1. **Dates Take Priority Over Status**
The `status` field in `tournament_competitions` is updated by:
- ✅ calculate-times API (immediately after Lifecycle saves)
- ✅ Auto-update cron job (every hour)

But the **frontend IGNORES status** and checks `reg_close_at` directly!

### 2. **Automatic Sync on Every Lifecycle Change**
Whenever admin updates registration dates via Lifecycle Manager:
1. Dates saved to `tournaments` table
2. calculate-times API called **automatically**
3. All competitions get new `reg_close_at` values
4. Frontend sees updated dates **immediately**

### 3. **15-Minute Buffer Enforced**
The calculate-times API ensures:
```typescript
const REGISTRATION_CLOSE_BUFFER_MS = 15 * 60 * 1000; // 15 minutes
const regCloseAt = new Date(teeTime - REGISTRATION_CLOSE_BUFFER_MS);
```

Every competition closes **exactly 15 minutes** before its round starts.

## 📊 Example Scenario

### Admin Actions (Lifecycle Manager):
```
Tournament: THE GREENIDGE OPEN
- Set registration_opens_at: 2025-12-26 07:00:00 UTC
- Set registration_closes_at: 2026-01-03 22:00:00 UTC
- Set round_1_start: 2025-12-31 06:20:00 UTC
- Set round_2_start: 2026-01-01 06:20:00 UTC
- Set round_3_start: 2026-01-02 06:20:00 UTC
- Set round_4_start: 2026-01-03 06:20:00 UTC

Click "Save Registration Times"
```

### Automatic Calculation:
```
Full Course (round_start = 1):
  reg_close_at = 2025-12-31 06:05:00 UTC (15 min before Round 1)

Second Round (round_start = 2):
  reg_close_at = 2026-01-01 06:05:00 UTC (15 min before Round 2)

Third Round (round_start = 3):
  reg_close_at = 2026-01-02 06:05:00 UTC (15 min before Round 3)

Final Strike (round_start = 4):
  reg_close_at = 2026-01-03 06:05:00 UTC (15 min before Round 4)
```

### Frontend Display (Jan 1, 2026 13:00 UTC):
```
Full Course:     🔴 CLOSED (past close time: 2025-12-31 06:05)
Second Round:    🔴 CLOSED (past close time: 2026-01-01 06:05)
Third Round:     ✅ OPEN   (closes at: 2026-01-02 06:05)
Final Strike:    ✅ OPEN   (closes at: 2026-01-03 06:05)

→ Tournament visible: YES (has 2 open competitions)
```

## 🚨 What If Status Field Gets Stale?

### Problem Scenario:
```
Competition has:
  status: 'registration_open'  ← STALE (cron hasn't run)
  reg_close_at: 2025-12-30     ← IN THE PAST
  Current date: 2026-01-01
```

### OLD Behavior (BUG):
```typescript
if (competition.status === 'registration_open') {
  return true; // ❌ Shows tournament even though registration closed!
}
```

### NEW Behavior (FIXED):
```typescript
if (isRegistrationOpen(comp.reg_open_at, comp.reg_close_at)) {
  // Checks: now >= new Date('2025-12-30')
  // Returns: false ✅
  return false;
}
// Tournament correctly hidden!
```

## ✅ Testing the Integration

Run this to verify everything works:
```powershell
node check-tournament-visibility.js
```

Expected output:
- ✅ Tournaments with future `reg_close_at` dates appear
- 🔴 Tournaments with all past `reg_close_at` dates are hidden
- Status field values are **ignored** in the calculation

## 📚 Related Documentation

- **Lifecycle Manager:** `TOURNAMENT-LIFECYCLE-MANAGER.md`
- **Workflow Guide:** `TOURNAMENT-WORKFLOW-GUIDE.md`
- **Visibility Safeguards:** `TOURNAMENT-VISIBILITY-SAFEGUARDS.md`
- **Original Fix:** `TOURNAMENT-VISIBILITY-FIX-2026-01-01.md`

## 🎯 Summary

**YES**, the Lifecycle Manager is fully integrated with the visibility safeguards:

1. ✅ Lifecycle Manager is the **single source of truth** for timing
2. ✅ calculate-times API **automatically syncs** competition dates
3. ✅ Frontend **always checks dates** (never trusts status)
4. ✅ Admin changes propagate **immediately** to player-facing pages
5. ✅ 15-minute buffer is **enforced consistently**

The entire system works together to ensure:
- **Admins control timing** via Lifecycle Manager
- **Competitions auto-calculate** their close times
- **Players see accurate data** based on real dates, not stale status fields

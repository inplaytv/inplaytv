# Tournament Visibility - FINAL FIX (2026-01-01)

## 🚨 THE ACTUAL ROOT CAUSE

After multiple "fixes" that didn't work, we finally found the TRUE root cause:

### The Problem
WESTGATE tournament was still showing on slider even though ALL competitions had closed registration. The diagnostic script confirmed:
- Final Strike: `reg_close_at = 2026-01-01 06:05:00` (CLOSED 8 hours ago)
- All other competitions: Also CLOSED
- Current time: `2026-01-01 14:24:57`

### Why Previous Fixes Failed
We implemented `isRegistrationOpen()` date validation and thought it was fixed. But tournaments STILL showed up!

**The bug was in `isCompetitionVisible()` line 479:**
```typescript
// Priority 2: Check if competition is live (tournament in progress)
if (competition.status === 'live') {
  return true; // ❌ BLINDLY ACCEPTS 'live' STATUS WITHOUT DATE VALIDATION!
}
```

**What was happening:**
1. Database shows: `Final Strike` has `status: 'live'` (stale from cron lag)
2. Frontend calls `isCompetitionVisible()`
3. Line 476 checks `isRegistrationOpen()` → Returns FALSE (dates correct)
4. Line 479 checks `status === 'live'` → Returns TRUE (status stale!)
5. Line 514 `tournament.competitions.some()` → Found 1 "visible" competition
6. Tournament incorrectly displays

### The Fix
Modified `isCompetitionVisible()` to **VALIDATE DATES FOR 'live' STATUS TOO**:

```typescript
export function isCompetitionVisible(competition: {
  status?: string;
  reg_open_at?: string | null;
  reg_close_at?: string | null;
  start_at?: string | null;  // NEW
  end_at?: string | null;    // NEW
}): boolean {
  // Priority 1: Check if registration is open by date (most reliable)
  if (isRegistrationOpen(competition.reg_open_at ?? null, competition.reg_close_at ?? null)) {
    return true;
  }
  
  // Priority 2: Check if competition is live (tournament in progress)
  // BUT also verify with dates - status field can be stale!
  if (competition.status === 'live') {
    const now = new Date();
    
    // If we have start_at, verify competition has actually started
    if (competition.start_at) {
      const startDate = new Date(competition.start_at);
      if (now < startDate) {
        return false; // Not started yet
      }
    }
    
    // If we have end_at, verify competition hasn't ended
    if (competition.end_at) {
      const endDate = new Date(competition.end_at);
      if (now > endDate) {
        return false; // Already ended
      }
    }
    
    // Status says live and dates confirm it (or dates missing)
    return true;
  }
  
  return false;
}
```

### Key Changes
1. Added `start_at?: string | null` to function signature
2. Added `end_at?: string | null` to function signature
3. Validate `start_at` before accepting 'live' status (competition must have started)
4. Validate `end_at` before accepting 'live' status (competition must not have ended)
5. Fixed TypeScript error: `?? null` to handle optional fields

### Expected Result
- **WESTGATE**: Should NOT show (all competitions have `end_at` in past OR `reg_close_at` in past)
- **Greenidge**: Should show (Third Round, Weekender, Final Strike open)
- **Northforland**: Should show (Final Strike open)

### Files Changed
- `apps/golf/src/lib/unified-competition.ts` (lines 468-507)

### Testing Commands
```powershell
# 1. Check database state
node check-tournament-visibility.js

# 2. Start dev server
cd "c:\inplaytv - New"
pnpm restart:golf

# 3. Open browser
http://localhost:3003/tournaments

# 4. Verify slider shows ONLY 2 tournaments (not 3)
```

### Lesson Learned
**NEVER trust ANY status field without date validation**. Not just `registration_open`, but also `live`, `completed`, etc. The cron job can lag by HOURS, causing status fields to be completely wrong.

### Prevention Rule
**ALL visibility/validation functions MUST:**
1. Check dates FIRST (if available)
2. Use status fields as FALLBACK ONLY (if dates missing)
3. NEVER return true based on status alone when dates contradict it

## Date Fields Reference
| Field | Purpose | Used For |
|-------|---------|----------|
| `reg_open_at` | Registration opens | Check if can accept entries |
| `reg_close_at` | Registration closes (start - 15 min) | Check if can accept entries |
| `start_at` | Competition starts | Check if competition has begun |
| `end_at` | Competition ends | Check if competition is over |
| `status` | Current lifecycle state | Fallback only, can be stale |

## Why This Keeps Breaking
Every time we "fixed" this, we only added date validation to ONE check (registration). But there are MULTIPLE code paths:
1. Registration check → Fixed in previous attempts
2. Live status check → **Fixed NOW** (was blindly trusting status)
3. Other status checks → Need to audit for same pattern

**The real fix:** Centralized utility functions (`unified-competition.ts`) that ALWAYS validate dates before trusting status. Use these EVERYWHERE, never bypass them.

# Tournament Visibility Safeguards

## ⚠️ CRITICAL RULE: NEVER Check Status Field Without Date Validation

**The Problem:** This bug has occurred 3+ times because developers check `competition.status === 'registration_open'` without validating if `reg_close_at` has passed.

**The Root Cause:** The `status` field is updated by a cron job and can be stale. The `reg_close_at` timestamp is the **single source of truth**.

## ✅ The Solution: Centralized Utility Functions

All competition visibility logic is now in **one place**: [`apps/golf/src/lib/unified-competition.ts`](apps/golf/src/lib/unified-competition.ts)

### Core Functions

```typescript
// Check if registration is currently open (by dates, not status)
isRegistrationOpen(regOpenAt, regCloseAt): boolean

// Check if a single competition should be visible
isCompetitionVisible(competition): boolean

// Check if a tournament should be visible (has ≥1 visible competition)
isTournamentVisible(tournament): boolean
```

## 🚫 WRONG Patterns (DO NOT USE)

```typescript
// ❌ BAD: Checking status without date validation
if (competition.status === 'registration_open') {
  // DANGER: Status could be stale!
}

// ❌ BAD: Manual date checking in components
const now = new Date();
if (now < new Date(competition.reg_close_at)) {
  // DANGER: Duplicates logic, will drift out of sync
}

// ❌ BAD: Inline filtering without utility
tournaments.filter(t => 
  t.competitions.some(c => c.status === 'reg_open')
)
```

## ✅ CORRECT Patterns (ALWAYS USE)

```typescript
// ✅ GOOD: Use centralized utility
import { isRegistrationOpen } from '@/lib/unified-competition';

if (isRegistrationOpen(competition.reg_open_at, competition.reg_close_at)) {
  // Safe! Date-based check with proper validation
}

// ✅ GOOD: Filter tournaments correctly
import { isTournamentVisible } from '@/lib/unified-competition';

const visibleTournaments = tournaments.filter(isTournamentVisible);

// ✅ GOOD: Check competition visibility
import { isCompetitionVisible } from '@/lib/unified-competition';

const openCompetitions = competitions.filter(isCompetitionVisible);
```

## 📍 Where These Functions Are Used

### Already Implemented (Safe)
- ✅ [`apps/golf/src/app/tournaments/page.tsx`](apps/golf/src/app/tournaments/page.tsx)
  - Line ~255: Tournament card status display
  - Line ~455: Slider filter
  - Line ~565: Competition grid filter
  - Line ~792: Tournament list filter

### Should Be Updated (If Issues Arise)
- [`apps/golf/src/app/tournaments/[slug]/page.tsx`](apps/golf/src/app/tournaments/[slug]/page.tsx) - Individual tournament page
- [`apps/golf/src/app/one-2-one/page.tsx`](apps/golf/src/app/one-2-one/page.tsx) - Challenge board filtering
- [`apps/golf/src/app/leaderboards/page.tsx`](apps/golf/src/app/leaderboards/page.tsx) - Tournament status badges

## 🔧 How to Add Future Filters

When adding new tournament/competition filtering:

1. **Import the utility:**
   ```typescript
   import { isTournamentVisible, isRegistrationOpen } from '@/lib/unified-competition';
   ```

2. **Use it directly:**
   ```typescript
   const filtered = tournaments.filter(isTournamentVisible);
   ```

3. **DO NOT create inline logic:**
   - Don't check `status` field
   - Don't parse dates manually
   - Don't duplicate the filtering logic

## 🧪 Testing

Run diagnostic script to verify visibility:
```powershell
node check-tournament-visibility.js
```

Should show:
- ✅ Tournaments with ≥1 competition where `reg_close_at` is in the future
- 🔴 Tournaments where ALL competitions have `reg_close_at` in the past

## 🔒 Code Review Checklist

Before merging any PR that touches tournament/competition filtering:

- [ ] Does it use `isTournamentVisible()` or `isRegistrationOpen()`?
- [ ] Does it avoid checking `competition.status` directly?
- [ ] Does it avoid manual `new Date(reg_close_at)` comparisons?
- [ ] Is the logic in a component, not duplicated across files?

## 📚 Related Files

- **Source of Truth:** `apps/golf/src/lib/unified-competition.ts`
- **Main Consumer:** `apps/golf/src/app/tournaments/page.tsx`
- **Test Script:** `check-tournament-visibility.js`
- **Documentation:** `TOURNAMENT-VISIBILITY-FIX-2026-01-01.md`

## 🚨 Emergency Fix

If tournaments disappear again:

1. Check if someone added inline filtering logic (search for `.filter(` in tournament pages)
2. Verify they're using `isTournamentVisible` from `unified-competition.ts`
3. If not, replace with the centralized utility
4. Run `node check-tournament-visibility.js` to verify fix
5. Update this document with the new location

## 💡 Why This Approach Works

1. **Single Source of Truth:** Logic exists in ONE file, not scattered across dozens of components
2. **Date Priority:** Always checks `reg_close_at` before trusting `status` field
3. **Import-able:** Can be used anywhere with a simple import
4. **Documented:** Clear comments explain the priority order
5. **Testable:** Diagnostic script verifies behavior without starting the app

## ⚡ Performance Note

The utility functions are lightweight (2-3 date comparisons). No performance concerns for filtering 100s of tournaments.

## 🔮 Future Improvements

Consider adding:
- TypeScript strict types for tournament/competition shapes
- Unit tests for `isRegistrationOpen()` with various date scenarios
- ESLint rule to warn about direct `status` checks (custom rule)
- Automated test that fails if tournaments page doesn't import from unified-competition

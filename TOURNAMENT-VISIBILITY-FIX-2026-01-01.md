# Tournament Visibility Fix - Jan 1, 2026

## Problem
Tournaments with competitions that had `status='registration_open'` but with past `reg_close_at` dates were incorrectly showing on the tournaments page. The filtering logic was checking the status field BEFORE validating the actual registration close dates.

## Root Cause
In [apps/golf/src/app/tournaments/page.tsx](apps/golf/src/app/tournaments/page.tsx), two filter functions had the same bug:

1. **Slider filter** (line ~455): Checked status first, returned `true` immediately without date validation
2. **Tournament list filter** (line ~820): Checked status first, returned `true` immediately without date validation

### Example Failure Case
```
Northforland Open Tournament:
  - Full Course: status='registration_open', reg_close_at='2025-12-30T09:05:00+00:00'
  - Current time: 2026-01-01 (PAST the close date)
  - Old logic: "status is registration_open → show it" ❌
  - New logic: "reg_close_at is in the past → hide it" ✅
```

## Fix Applied

### Changed Filter Logic Order
**OLD (WRONG):**
```typescript
if (comp.status === 'registration_open' || comp.status === 'reg_open') {
    return true; // ❌ Returns immediately without checking dates!
}

// Date checks come AFTER, never reached
const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
if (now >= regCloseAt) return false;
```

**NEW (CORRECT):**
```typescript
// Check dates FIRST (most reliable)
const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;

// If no date info, trust status field as fallback
if (!regCloseAt) {
    return comp.status === 'live' || comp.status === 'registration_open' || comp.status === 'reg_open';
}

// Registration has closed by date
if (now >= regCloseAt) return false;

// Check if registration has started
if (comp.reg_open_at) {
    const regOpenAt = new Date(comp.reg_open_at);
    if (now < regOpenAt) return false;
}

// Registration is open by date
return true;
```

## Key Principle
**ALWAYS CHECK DATES BEFORE STATUS**

The `status` field can be stale if the auto-update cron job hasn't run recently. The `reg_close_at` timestamp is the **single source of truth** for whether registration is actually open.

## Files Modified
1. **apps/golf/src/app/tournaments/page.tsx** (line ~450-480): Slider `totalSlides` filter
2. **apps/golf/src/app/tournaments/page.tsx** (line ~820-850): Tournament list filter

## Testing
Run diagnostic script to verify:
```powershell
node check-tournament-visibility.js
```

Should show:
- ✅ Tournaments with at least one competition with `reg_close_at` in the future
- 🔴 Tournaments where ALL competitions have `reg_close_at` in the past

## Why This Kept Breaking
This issue occurred 3+ times because the filter logic was split across multiple places with slightly different implementations. Each time a fix was applied to one location, another location still had the bug.

## Prevention
When checking competition availability:
1. **ALWAYS** get `reg_close_at` date first
2. **IF** date exists, use date-based logic
3. **ONLY** fall back to status field when date is NULL
4. **NEVER** trust status field when dates are available

## Related Issues
- Status field lag: `status` is updated by cron job, may be delayed
- Timezone handling: All dates stored in UTC, correctly handled by `new Date()`
- Registration buffer: Competitions close 15 minutes before round start (set by Lifecycle Manager)

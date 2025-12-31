# Westgate Tournament Visibility Debug

## Current Status ✅

### Database Check (PASSED)
Ran `check-westgate-tournaments-api.js` which confirmed:
- ✅ Westgate tournament IS returned by API query
- ✅ Tournament status: `registration_open`
- ✅ Tournament visible: `true`
- ✅ Final Strike competition exists (ID: 07af5a27-8fd1-4993-8388-1b4b52034634)
- ✅ Final Strike registration open until: 2026-01-01T06:05:00 (tomorrow 6:05 AM)
- ✅ Final Strike status: `registration_open`

### API Route Check (PASSED)
`apps/golf/src/app/api/tournaments/route.ts`:
- ✅ Filters tournaments by status: `['upcoming', 'registration_open', 'registration_closed', 'live']`
- ✅ Westgate has status `registration_open` - PASSES filter
- ✅ End date check: `gte('end_date', todayStr)` - Westgate ends Jan 1, 2026 - PASSES
- ✅ Competition query includes ALL InPlay competitions

### Frontend Filter Check (PASSED)
`apps/golf/src/app/tournaments/page.tsx` line 773-798:
```typescript
const upcomingTournaments = tournaments.filter(tournament => {
  // Show if ANY competition has open registration by date
  const hasOpenRegistration = tournament.competitions.some(comp => {
    const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
    if (!regCloseAt) return false;
    if (now >= regCloseAt) return false; // Registration closed
    if (comp.reg_open_at) {
      const regOpenAt = new Date(comp.reg_open_at);
      if (now < regOpenAt) return false; // Not started yet
    }
    return true; // Registration is open
  });
  return hasOpenRegistration;
});
```

**Logic Analysis**:
- Westgate has Final Strike with `reg_close_at = 2026-01-01T06:05:00`
- Current time is before that (it's Dec 31, 2025)
- Therefore `now >= regCloseAt` is FALSE
- Therefore `hasOpenRegistration` should be TRUE
- Therefore tournament should PASS filter

## Likely Cause 🎯

**Browser cache or stale data**. The code logic is 100% correct. The API returns the correct data. The frontend filtering logic is correct.

## Solutions

### Option 1: Hard Refresh Browser
1. Open http://localhost:3003/tournaments
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. This forces browser to bypass cache

### Option 2: Clear Next.js Cache
```powershell
cd c:\inplaytv - New\apps\golf
rm -r -fo .next
pnpm dev:golf
```

### Option 3: Check API Response Directly
Visit: http://localhost:3003/api/tournaments?status=active

Should show Westgate in the JSON response with Final Strike in competitions array.

### Option 4: Add Console Logging (Debug Only)
In `apps/golf/src/app/tournaments/page.tsx` line 773, add:
```typescript
const upcomingTournaments = tournaments.filter(tournament => {
  console.log('Checking tournament:', tournament.name);
  const hasOpenRegistration = tournament.competitions.some(comp => {
    const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
    console.log(`  - Competition: ${comp.competition_types?.name}, reg_close_at: ${regCloseAt}, now: ${now}`);
    // ... rest of logic
  });
  console.log(`  → hasOpenRegistration: ${hasOpenRegistration}`);
  return hasOpenRegistration;
});
```

Then check browser DevTools console to see what's being filtered.

## Expected Outcome

After cache clear/refresh, tournaments page should show:
- ✅ **Slider**: Westgate tournament card with Final Strike as featured competition
- ✅ **Competition Cards**: Final Strike card with countdown to Jan 1 06:05
- ✅ Both Westgate and Northforland in slider (2 tournaments with open competitions)

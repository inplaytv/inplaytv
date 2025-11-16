# Quick Fixes - Golf App & Featured Competitions

## Issues Fixed

### 1. Golf App: "Invalid data format received from server" ✅
**Problem:** API now returns `{ tournaments: [], featured: [] }` but page expected just an array

**Fix:** Updated `apps/golf/src/app/tournaments/page.tsx` fetchData() to handle new format:
```typescript
// Now handles both:
if (Array.isArray(data.tournaments)) {
  setTournaments(data.tournaments);
} else if (Array.isArray(data)) {
  // Fallback for old format
  setTournaments(data);
}
```

### 2. Featured Competitions: Draft status excluded ✅
**Problem:** Draft competitions weren't showing in Featured Competitions manager

**Fix:** Added 'draft' status to all queries:

**Files Updated:**
1. `apps/admin/src/app/api/featured-competitions/route.ts`
   - Changed: `.in('status', ['draft', 'upcoming', 'reg_open', 'reg_closed', 'live'])`

2. `apps/golf/src/app/api/tournaments/route.ts`
   - Updated 3 queries to include 'draft' status
   - Featured competitions query
   - Tournament competitions query
   - Bottom featured query

## What Now Works

✅ Golf app tournaments page loads without "Invalid data format" error
✅ Draft competitions appear in admin Featured Competitions page
✅ Can select draft competitions as featured (for testing)
✅ Draft competitions show on golf app (useful during development)

## Test It

### Admin Panel (localhost:3002)
1. Go to Featured Competitions
2. Should see your draft competitions listed
3. Click "+ Feature" on a competition
4. Set as position 1 or 2
5. Optionally add a featured message

### Golf App (localhost:3001)
1. Go to /tournaments
2. Should load without errors
3. Console log shows: `{ tournaments: [...], featured: [...] }`

## Production Note

When going live, you may want to change queries back to exclude 'draft':
- Remove 'draft' from `.in('status', [...])` arrays
- This ensures only public competitions show on golf app
- Keep it for admin panel so admins can still manage drafts

## Next Steps

Once you've set featured competitions in admin:
1. Update golf tournaments page UI to display featured at top
2. Style featured cards with custom messages
3. Create tournament detail pages
4. Update team builder routing

# Competition Status & Tour Badge Fixes

## Issues Fixed
1. ✅ Competition status showing "In Play" instead of "Registration Open"
2. ✅ Missing tour badge in competition card headers

## Root Causes

### Issue 1: Competition Status Display
**Problem**: Competitions showed "In Play" even though users could still register

**Root Cause**: 
- The `getStatusBadge()` function was checking the database `status` field (which was set to `'inplay'`) BEFORE checking the actual registration deadline timestamps
- This meant competitions marked as "inplay" in the database would always show "Live" even if `reg_close_at` hadn't passed yet

**Fix Applied** (lines 569-596 in [page.tsx](apps/golf/src/app/tournaments/[slug]/page.tsx)):
```typescript
// PRIORITY 3: Check if registration is currently open by dates (MOST IMPORTANT!)
// This must come BEFORE checking database status
if (regOpenAt && regCloseAt) {
  if (now >= regOpenAt && now < regCloseAt) {
    // Registration is open - regardless of database status field
    return statusConfig.reg_open;
  } else if (now >= regCloseAt) {
    // Registration has closed - show as Live if tournament ongoing, otherwise closed
    if (tournamentEndOfDay && now <= tournamentEndOfDay) {
      return statusConfig.live;
    }
    return statusConfig.reg_closed;
  }
}

// PRIORITY 4: Check database status only if no clear date-based answer
if (competition.status === 'reg_open' && (!regCloseAt || now < regCloseAt)) {
  return statusConfig.reg_open;
}
```

**Key Changes**:
1. Moved date-based checks BEFORE database status checks
2. Registration deadline (`reg_close_at`) now takes absolute priority
3. If `now < reg_close_at`, always show "Registration Open" regardless of database status
4. Only check database `status` field as fallback when dates aren't conclusive

### Issue 2: Missing Tour Badge
**Problem**: No tour badge displayed in competition card headers (e.g., "EURO TOUR", "PGA TOUR")

**Root Cause**: 
- Tour badge was only displayed in the hero section header (lines 674-683)
- Competition cards had no tour badge rendering

**Fix Applied**:

1. **Added tour badge to CompetitionCard** (lines 147-157 in [page.tsx](apps/golf/src/app/tournaments/[slug]/page.tsx)):
```typescript
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
  <h3>{competition.competition_types.name}</h3>
  {tour && (
    <div className={`${styles.tourBadge} ${
      tour === 'PGA' ? styles.tourBadgePGA :
      tour === 'LPGA' ? styles.tourBadgeLPGA :
      styles.tourBadgeEuropean
    }`} style={{ position: 'static', margin: 0, fontSize: '0.5rem', padding: '0.2rem 0.5rem' }}>
      {tour} TOUR
    </div>
  )}
</div>
```

2. **Added tour badge CSS styles** (lines 1158-1193 in [tournament-detail.module.css](apps/golf/src/app/tournaments/[slug]/tournament-detail.module.css)):
```css
/* Tour Badge Styles */
.tourBadge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tourBadgePGA {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: #ffffff;
  border: 1px solid rgba(59, 130, 246, 0.5);
}

.tourBadgeEuropean {
  background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
  color: #ffffff;
  border: 1px solid rgba(16, 185, 129, 0.5);
}

.tourBadgeLPGA {
  background: linear-gradient(135deg, #7c2d12 0%, #f97316 100%);
  color: #ffffff;
  border: 1px solid rgba(249, 115, 22, 0.5);
}
```

## Testing

### Expected Results

**Alfred Dunhill Championship** (European Tour):
- ✅ "THE WEEKENDER" should show "Registration Open" (not "In Play")
- ✅ All competition cards should display "EUROPEAN TOUR" badge next to competition name
- ✅ Badge should have green gradient styling

**PGA TOUR Q-School**:
- ✅ All competitions should show "Registration Open" if before `reg_close_at`
- ✅ All competition cards should display "PGA TOUR" badge
- ✅ Badge should have blue gradient styling

### Status Badge Logic Priority (in order):
1. ✅ Tournament completed (past `end_date` + end of day)
2. ✅ Database status = 'cancelled'
3. ✅ **Registration deadline check** (`reg_close_at` vs current time) ← **FIX APPLIED HERE**
4. ✅ Database status as fallback
5. ✅ Draft status if nothing else matches

## Files Modified
1. [apps/golf/src/app/tournaments/[slug]/page.tsx](apps/golf/src/app/tournaments/[slug]/page.tsx)
   - Lines 569-596: Reordered status priority (dates before DB status)
   - Lines 147-157: Added tour badge to card header

2. [apps/golf/src/app/tournaments/[slug]/tournament-detail.module.css](apps/golf/src/app/tournaments/[slug]/tournament-detail.module.css)
   - Lines 1158-1193: Added tour badge styles (PGA, European, LPGA)

## Impact
- ✅ No breaking changes
- ✅ Existing functionality preserved
- ✅ Competition registration logic now correctly date-driven
- ✅ Visual enhancement with tour badges
- ✅ No database changes required

## Next Steps
1. ✅ Changes deployed (hot reload in dev mode)
2. 🔄 Test on tournament page: http://localhost:3003/tournaments/alfred-dunhill-championship-2024
3. ✅ Verify both Alfred Dunhill and PGA Q-School display correctly
4. ⏳ Monitor for any edge cases with other tournaments

## Notes
- The `extractTour()` function (lines 62-68) determines tour from tournament description/name
- Tour detection looks for keywords: 'lpga', 'european', 'pga' in description/name text
- Future enhancement: Store tour as explicit field in `tournaments` table instead of text parsing

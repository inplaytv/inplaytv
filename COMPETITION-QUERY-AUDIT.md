# Tournament Competitions Query Audit

## Purpose
Verify which queries need `.eq('competition_format', 'inplay')` filter to exclude ONE 2 ONE challenges from InPlay competition listings.

## Critical Principle
**ONE 2 ONE challenges should ONLY appear on Challenge Board, NEVER in tournament competition lists**

---

## Golf App - User Facing

### ✅ CORRECTLY FILTERED (InPlay only)
| File | Line | Purpose | Status |
|------|------|---------|--------|
| `apps/golf/src/app/api/tournaments/route.ts` | 98 | Tournament list with competitions | ✅ **FIXED** - Added `.eq('competition_format', 'inplay')` |
| `apps/golf/src/app/api/tournaments/[slug]/route.ts` | 41 | Single tournament competitions | ✅ **FIXED** - Added `.eq('competition_format', 'inplay')` |

### ✅ CORRECTLY FILTERED (ONE 2 ONE only)
| File | Line | Purpose | Status |
|------|------|---------|--------|
| `apps/golf/src/app/api/tournaments/[slug]/one-2-one/route.ts` | 84 | Challenge board | ✅ Has `.eq('competition_format', 'one2one')` |
| `apps/golf/src/app/api/one-2-one/all-open-challenges/route.ts` | 13 | All open challenges | ✅ Need to verify |
| `apps/golf/src/app/api/one-2-one/join/route.ts` | 36, 100, 144, 183 | Join/create challenges | ✅ ONE 2 ONE operations |

### ⚠️ NEEDS REVIEW
| File | Line | Purpose | Needs Filter? |
|------|------|---------|---------------|
| `apps/golf/src/app/api/competitions/[competitionId]/route.ts` | 21 | Get single competition | ❌ No - Generic endpoint |
| `apps/golf/src/app/api/competitions/[competitionId]/entries/route.ts` | 50 | Create entry | ❌ No - Works for both |
| `apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts` | 95 | Get available golfers | ❌ No - Works for both |
| `apps/golf/src/app/api/competitions/[competitionId]/leaderboard/route.ts` | 25 | Leaderboard | ❌ No - Works for both |
| `apps/golf/src/app/api/user/my-entries/route.ts` | 56 | User's entries | ❌ No - Shows all types |
| `apps/golf/src/app/one-2-one/challenge/[instanceId]/page.tsx` | 24 | Challenge detail page | ❌ No - ONE 2 ONE specific |

---

## Admin App

### ⚠️ ADMIN NEEDS REVIEW
| File | Line | Purpose | Needs Filter? |
|------|------|---------|---------------|
| `apps/admin/src/app/tournaments/page.tsx` | 65 | Competition count | **MAYBE** - Shows count only |
| `apps/admin/src/app/api/tournament-lifecycle/route.ts` | 85 | Competition count | **MAYBE** - Shows count only |
| `apps/admin/src/app/api/tournaments/[id]/competitions/route.ts` | 18 | Get tournament competitions | **YES** - Admin comp management |

### ✅ ADMIN OPERATIONS (Correct)
| File | Line | Purpose | Status |
|------|------|---------|--------|
| `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts` | 476, 485 | Sync golfers to InPlay | ✅ Already filtered |
| `apps/admin/src/app/api/tournaments/[id]/golfer-groups/route.ts` | 131, 140 | Assign golfer groups | ✅ Already filtered with `.eq('competition_format', 'inplay')` |

---

## Web App (Marketing)

### ⚠️ WEB NEEDS FILTER
| File | Line | Purpose | Needs Filter? |
|------|------|---------|---------------|
| `apps/web/src/app/api/tournaments/route.ts` | 52 | Public tournament list | **YES** - Should only show InPlay |

---

## Recommendations

### 1. Admin Tournament Listings
**Decision**: Admin should see InPlay competitions ONLY in tournament management
- Add filter to `apps/admin/src/app/tournaments/page.tsx` (line 65)
- Add filter to `apps/admin/src/app/api/tournament-lifecycle/route.ts` (line 85)
- Add filter to `apps/admin/src/app/api/tournaments/[id]/competitions/route.ts` (line 18)

### 2. Web Marketing Site
**Decision**: Public site should only show InPlay competitions
- Add filter to `apps/web/src/app/api/tournaments/route.ts` (line 52)

### 3. Generic Competition Endpoints
**Decision**: Leave unfiltered - they work by competition ID, valid for both types
- `/api/competitions/[competitionId]/*` - All stay generic

---

## Summary of Changes Made

### ✅ Completed
1. **Golf App - Tournament List** (route.ts line 98) - Added InPlay filter
2. **Golf App - Tournament Detail** ([slug]/route.ts line 41) - Added InPlay filter

### 🔜 Recommended Next
3. **Web App - Tournament List** (web/api/tournaments/route.ts line 52) - Add InPlay filter
4. **Admin - Tournament Listings** (admin/tournaments/page.tsx line 65) - Add InPlay filter
5. **Admin - Lifecycle Manager** (admin/api/tournament-lifecycle/route.ts line 85) - Add InPlay filter  
6. **Admin - Competition Management** (admin/api/tournaments/[id]/competitions/route.ts line 18) - Add InPlay filter

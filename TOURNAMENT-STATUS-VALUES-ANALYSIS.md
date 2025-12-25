# Tournament Status Values - Complete Analysis

**Date**: 2024-12-24  
**Purpose**: Document the CORRECT status values for tournaments and prevent breaking existing functionality

## 🔍 What We Found

### Current Database Status Values
All 8 existing tournaments currently have status: `"completed"`

### Database Constraint Definition
From `scripts/fix-tournament-status-FORCE.sql` (line 31):
```sql
CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'))
```

## ✅ CORRECT Status Values (Database Uses FULL WORDS)

| Status | Database Value | Admin Uses | Golf App Uses | Lifecycle Manager Uses |
|--------|----------------|------------|---------------|------------------------|
| Draft | `draft` | ✅ | N/A | N/A |
| Upcoming | `upcoming` | ✅ | ✅ | ✅ |
| Registration Open | `registration_open` | ✅ | ✅ | ✅ |
| Registration Closed | `registration_closed` | ✅ | ✅ | ✅ |
| Live/In Progress | `live` | ✅ | ✅ `in_progress` (mapped) | ✅ `in_progress` (mapped) |
| Completed | `completed` | ✅ | ✅ | ✅ |
| Cancelled | `cancelled` | ✅ | ✅ | ✅ |

## ❌ INCORRECT Values Found in Code (NOT in database constraint)

### These Were Used in Old Dropdowns (WRONG):
- `reg_open` - ❌ Should be `registration_open`
- `reg_closed` - ❌ Should be `registration_closed`

### Where They Appeared (Fixed Today):
1. **`apps/admin/src/app/tournaments/new/page.tsx`** - Manual tournament creation dropdown
   - Had: `<option value="reg_open">` ❌
   - **FIXED TO**: `<option value="registration_open">` ✅

2. **`apps/admin/src/app/tournaments/[id]/page.tsx`** - Tournament edit page
   - Still has SHORT values in competition status dropdowns (lines 1378, 1442)
   - Uses `reg_open` and `reg_closed` ⚠️ **NEEDS CHECKING**

3. **`apps/admin/src/lib/tournament-lifecycle.ts`** - Lifecycle constants
   - Defines: `REGISTRATION_OPEN: 'reg_open'` ❌
   - Defines: `REGISTRATION_CLOSED: 'reg_closed'` ❌
   - **This is used by admin to DISPLAY labels, not store in DB** ⚠️

## 🔄 Status Value Mapping

### Golf App Mapping (Golf App Display → Database)
From `apps/golf/src/lib/status-utils.ts`:
```typescript
const STATUS_MAP = {
  'registration_open': 'reg_open',     // Display only
  'registration_closed': 'reg_closed', // Display only
  'in_progress': 'live',               // Golf app shows "in_progress" but DB stores "live"
}
```

**IMPORTANT**: This is **ONLY for display purposes**. The database still stores full words.

## 📊 Where Each System Uses What

### 1. Database (Source of Truth)
```sql
status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled')
```

### 2. Admin Dashboard
**Tournament Creation** (`apps/admin/src/app/tournaments/new/page.tsx`):
- ✅ **FIXED**: Now uses full database values
- Initial state: `draft`
- Dropdown: `draft`, `upcoming`, `registration_open`, `registration_closed`, `live`, `completed`, `cancelled`

**Tournament Edit** (`apps/admin/src/app/tournaments/[id]/page.tsx`):
- ⚠️ **MAY NEED REVIEW**: Competition status dropdowns still use short values (lines 1378, 1442)
- BUT: Tournament statuses use full values (line 908)

**Lifecycle Manager** (`apps/admin/src/app/tournament-lifecycle/**`):
- Uses full database values: `upcoming`, `registration_open`, `in_progress`, `completed`, `cancelled`
- Works directly with database, no mapping

### 3. Golf App (Player-Facing)
**Display Status** (`apps/golf/src/lib/status-utils.ts`):
- Reads from database: `registration_open`, `registration_closed`, `live`
- Maps for display to: `reg_open`, `reg_closed`, `live`
- **BUT this is just for UI labels, DB queries still use full words**

**API Queries** (`apps/golf/src/app/api/tournaments/route.ts`):
- ✅ Uses full database values: `['upcoming', 'registration_open', 'registration_closed', 'live']`

### 4. Web App (Marketing Site)
**API Route** (`apps/web/src/app/api/tournaments/route.ts`):
- ⚠️ **MIXED**: Line 73 uses SHORT values for query
```typescript
.in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])  // ❌ SHORT values
```
- **This works ONLY if database actually has these short values (which it DOESN'T)**

## 🚨 Potential Issues

### 1. Web App API Filter (HIGH PRIORITY)
**File**: `apps/web/src/app/api/tournaments/route.ts` (line 73)
**Issue**: Queries for `'reg_open'` and `'reg_closed'` but database has `'registration_open'` and `'registration_closed'`
**Result**: May not return tournaments in registration phase
**Fix Needed**: Change to full words

### 2. Admin Tournament Edit Competitions (MEDIUM PRIORITY)
**File**: `apps/admin/src/app/tournaments/[id]/page.tsx` (lines 1378, 1442)
**Issue**: Competition status dropdowns use short values
**Note**: Competitions might have different schema - need to verify

### 3. Admin Lifecycle Constants (LOW PRIORITY)
**File**: `apps/admin/src/lib/tournament-lifecycle.ts`
**Issue**: Defines short constants but may not be used for DB writes
**Note**: Appears to be for display only

## ✅ What's Working Correctly

1. ✅ **Tournament Lifecycle Manager** - Uses full database values
2. ✅ **Golf App API** - Queries with full database values
3. ✅ **Admin Tournament Creation** - **FIXED TODAY** to use full values
4. ✅ **Database Constraint** - Validates full words only

## 📋 Recommended Actions

### Immediate (Done Today)
- [x] Fixed tournament creation form to use full database values

### High Priority (Do Next)
- [ ] Fix `apps/web/src/app/api/tournaments/route.ts` line 73 to use full values
- [ ] Verify competition status schema (might be different from tournaments)

### Medium Priority (Review Soon)
- [ ] Check if `apps/admin/src/lib/tournament-lifecycle.ts` short constants are used anywhere
- [ ] Audit all API routes that filter by status

### Low Priority (Nice to Have)
- [ ] Consider standardizing display mapping to single location
- [ ] Add TypeScript types to enforce correct status values

## 🎯 Summary for AI Assistant

**When creating/editing tournaments:**
- ✅ Always use: `registration_open` (NEVER `reg_open`)
- ✅ Always use: `registration_closed` (NEVER `reg_closed`)
- ✅ Use: `live` (Golf app may display as `in_progress` but DB stores `live`)
- ✅ Initial state for manual creation: `draft` is valid
- ✅ All other values: `upcoming`, `completed`, `cancelled`

**Database constraint allows:**
```
'draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'
```

**Any other value will cause constraint violation error.**

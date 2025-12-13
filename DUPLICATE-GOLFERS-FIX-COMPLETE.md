# Duplicate Golfers Fix - Complete Solution

## 🔴 CRITICAL ISSUE
Team builder showing **329 golfers** instead of **156** for Alfred Dunhill Championship.

## 📋 Root Cause Analysis

### What Happened
1. **Missing Database Constraint**: `tournament_golfers` table had no UNIQUE constraint on `(tournament_id, golfer_id)`
2. **Sync Called Multiple Times**: sync-golfers API was called without `replace=true`, causing duplicates
3. **No API Deduplication**: Golfers API returned ALL rows without filtering duplicates
4. **Race Condition**: Tee time updates happened before the `replace` check

### Why Upsert Failed
The `upsert` in sync-golfers uses:
```typescript
.upsert(golfersToInsert, {
  onConflict: 'tournament_id,golfer_id',
  ignoreDuplicates: false
})
```

BUT PostgreSQL requires an **actual UNIQUE constraint or index** at the database level. The `onConflict` parameter alone doesn't create the constraint - it just tells Supabase which constraint to use IF it exists.

## ✅ COMPLETE FIX (4 Steps)

### Step 1: Run Cleanup SQL ⚡ DO THIS FIRST
Run in Supabase SQL Editor:
```bash
FIX-DUPLICATE-GOLFERS-DUNHILL.sql
```
This removes 173 duplicate entries, keeping the most recent entry for each golfer.

### Step 2: Add Database Constraint 🔒 CRITICAL
Run in Supabase SQL Editor:
```bash
PREVENT-DUPLICATE-GOLFERS-CONSTRAINT.sql
```
This creates a UNIQUE constraint at the database level to prevent future duplicates.

### Step 3: API Deduplication ✨ COMPLETED
Fixed `apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts`:
- Added deduplication filter to remove any duplicates before processing
- Added logging to warn if duplicates are detected
- Added count logging: `📊 Golfers: 329 total, 156 unique`

Changes:
```typescript
// Deduplicate golfers (safety check in case duplicates exist in database)
const seenGolferIds = new Set<string>();
const deduplicatedData = (data || []).filter((item: any) => {
  if (seenGolferIds.has(item.golfer_id)) {
    console.warn(`⚠️ Duplicate golfer detected for tournament ${tournamentId}: ${item.golfer_id}`);
    return false;
  }
  seenGolferIds.add(item.golfer_id);
  return true;
});

console.log(`📊 Golfers: ${data?.length || 0} total, ${deduplicatedData.length} unique`);
```

### Step 4: Test & Verify 🧪
1. Navigate to http://localhost:3003/tournaments/alfred-dunhill-championship
2. Click "Build Your Team" on any competition
3. Verify golfer count is **156** (not 329)
4. Check console for: `📊 Golfers: 156 total, 156 unique`

## 🛡️ Prevention Mechanisms

### Database Level
- ✅ UNIQUE constraint on `(tournament_id, golfer_id)`
- ✅ Index for performance: `idx_tournament_golfers_tournament_golfer`

### API Level  
- ✅ Deduplication filter in golfers API
- ✅ Warning logs if duplicates detected
- ✅ Count logging for monitoring

### Monitoring
- Console logs show duplicate detection
- Count comparison: total vs unique
- Constraint violations will now throw errors (preventing silent duplicates)

## 📊 Before & After

### Before
```
Total rows in tournament_golfers: 329
Unique golfer_id values: 156
Duplicates: 173
Team builder showing: 329 golfers ❌
```

### After (Step 1 - Cleanup)
```
Total rows in tournament_golfers: 156
Unique golfer_id values: 156
Duplicates: 0
Team builder showing: 156 golfers ✅
```

### After (Step 2 - Constraint)
```
Database: UNIQUE constraint active
Future duplicates: PREVENTED (constraint violation error)
Sync behavior: Upsert now works correctly ✅
```

### After (Step 3 - API Fix)
```
API: Deduplication active
Safety net: If duplicates exist, they're filtered out
Monitoring: Logs warn if duplicates detected ✅
```

## 🚀 Deployment Steps

1. **Immediate** (Fix data):
   ```sql
   -- Run in Supabase SQL Editor
   \i FIX-DUPLICATE-GOLFERS-DUNHILL.sql
   ```

2. **Critical** (Prevent recurrence):
   ```sql
   -- Run in Supabase SQL Editor
   \i PREVENT-DUPLICATE-GOLFERS-CONSTRAINT.sql
   ```

3. **Deploy** (API fix):
   ```bash
   git add apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts
   git commit -m "fix: Add deduplication to golfers API and logging for duplicates"
   git push
   ```

4. **Verify**:
   - Test team builder loads correctly
   - Check console logs for counts
   - Try running sync-golfers again
   - Verify no duplicates created

## 🔍 Verification Queries

Check for duplicates in ANY tournament:
```sql
SELECT 
  t.name,
  tg.tournament_id,
  tg.golfer_id,
  COUNT(*) as occurrence_count,
  array_agg(tg.id) as duplicate_ids
FROM tournament_golfers tg
JOIN tournaments t ON t.id = tg.tournament_id
GROUP BY tg.tournament_id, tg.golfer_id, t.name
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;
```

Check constraint is active:
```sql
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'tournament_golfers'::regclass
  AND conname LIKE '%tournament%golfer%';
```

## ✅ Success Criteria

- [ ] Alfred Dunhill Championship shows exactly 156 golfers
- [ ] No console errors or warnings about duplicates
- [ ] Database constraint is active (verify with SQL query)
- [ ] Running sync-golfers twice doesn't create duplicates
- [ ] No other tournaments have duplicates

## 🎯 Why This Works

1. **Database Constraint**: PostgreSQL enforces uniqueness at storage level - impossible to create duplicates
2. **API Deduplication**: Even if duplicates somehow exist, they're filtered before display
3. **Upsert Now Works**: With constraint in place, `onConflict` parameter actually works
4. **Monitoring**: Logs alert us if duplicates are detected (shouldn't happen with constraint)

## 📚 Key Learnings

1. **Supabase upsert requires database constraints**: The `onConflict` parameter doesn't create a constraint - it references an existing one
2. **Always add constraints at database level**: Application-level checks are insufficient
3. **Defense in depth**: Multiple layers (constraint + API filter + monitoring)
4. **Test constraint behavior**: Just because upsert code looks correct doesn't mean the constraint exists

## 🔗 Related Files

- `CHECK-DUPLICATE-GOLFERS.sql` - Diagnostic queries
- `FIX-DUPLICATE-GOLFERS-DUNHILL.sql` - Cleanup script
- `PREVENT-DUPLICATE-GOLFERS-CONSTRAINT.sql` - Constraint creation
- `apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts` - Fixed API
- `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts` - Sync API (upsert)

---
**Status**: API fix complete ✅ | SQL scripts ready ⏳ | Testing required 🧪

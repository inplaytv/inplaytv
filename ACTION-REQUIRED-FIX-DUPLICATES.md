## 🎯 IMMEDIATE ACTION REQUIRED

You now have **3 SQL scripts** ready to fix the duplicate golfers issue:

### 1️⃣ CHECK-DUPLICATE-GOLFERS.sql
**Run this first** to confirm the issue:
- Shows which golfers are duplicated
- Shows total count (329) vs unique count (156)
- Shows when duplicates were created

### 2️⃣ FIX-DUPLICATE-GOLFERS-DUNHILL.sql  
**Run this second** to clean up the data:
- Removes 173 duplicate entries
- Keeps the most recent entry for each golfer
- Shows before/after counts for verification

### 3️⃣ PREVENT-DUPLICATE-GOLFERS-CONSTRAINT.sql
**Run this third** to prevent future duplicates:
- Adds UNIQUE constraint at database level
- Creates performance index
- Ensures upsert works correctly going forward

---

## 🔧 Code Fix Applied

I've already fixed the API code in:
**[apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts](apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts)**

Changes:
- ✅ Added deduplication filter
- ✅ Added warning logs if duplicates detected  
- ✅ Added count logging: `📊 Golfers: X total, Y unique`
- ✅ All golfer processing now uses deduplicated data

This means **even before you run the SQL cleanup**, the team builder will now show only 156 unique golfers instead of 329.

---

## 🚀 Next Steps

1. **Go to Supabase SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. **Run each SQL file in order**:
   ```
   1. CHECK-DUPLICATE-GOLFERS.sql (diagnose)
   2. FIX-DUPLICATE-GOLFERS-DUNHILL.sql (clean up)
   3. PREVENT-DUPLICATE-GOLFERS-CONSTRAINT.sql (prevent)
   ```

3. **Test the team builder**:
   - Navigate to: http://localhost:3003/tournaments/alfred-dunhill-championship
   - Click "Build Your Team" 
   - **Expected**: See exactly 156 golfers (not 329)
   - Check browser console for: `📊 Golfers: 156 total, 156 unique`

4. **Commit the code fix**:
   ```bash
   git add apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts
   git add DUPLICATE-GOLFERS-FIX-COMPLETE.md
   git add CHECK-DUPLICATE-GOLFERS.sql
   git add FIX-DUPLICATE-GOLFERS-DUNHILL.sql  
   git add PREVENT-DUPLICATE-GOLFERS-CONSTRAINT.sql
   git commit -m "fix: Remove duplicate golfers from team builder and prevent future occurrences"
   ```

---

## 🎓 What Caused This

The sync-golfers API uses:
```typescript
.upsert(golfersToInsert, {
  onConflict: 'tournament_id,golfer_id'
})
```

**BUT** PostgreSQL requires an actual UNIQUE constraint at the database level. The `onConflict` parameter doesn't create the constraint - it just references it. Without the constraint, calling sync twice without `replace=true` created duplicates.

---

## 🛡️ Prevention (Why This Won't Happen Again)

1. **Database Constraint** (Step 3 SQL): Makes duplicates impossible at storage level
2. **API Deduplication** (Already applied): Filters duplicates even if they exist  
3. **Warning Logs** (Already applied): Alerts us if duplicates are detected
4. **Upsert Now Works**: With constraint in place, future syncs won't create duplicates

---

## ✅ Success Criteria

After running all 3 SQL scripts:
- [ ] Team builder shows exactly 156 golfers
- [ ] Console shows: `📊 Golfers: 156 total, 156 unique`  
- [ ] No duplicate warnings in console
- [ ] Running sync-golfers twice doesn't create duplicates
- [ ] Database constraint is active (verify with CHECK script)

---

See **[DUPLICATE-GOLFERS-FIX-COMPLETE.md](DUPLICATE-GOLFERS-FIX-COMPLETE.md)** for full documentation and root cause analysis.

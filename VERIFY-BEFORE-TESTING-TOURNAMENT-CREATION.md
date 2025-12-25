# ⚠️ VERIFICATION NEEDED: Tournament Status Schema

**Created**: 2024-12-24  
**Action Required**: Run this query BEFORE testing tournament creation

## 🔍 The Problem

Your database may have **TWO DIFFERENT** status constraint versions:

### Version 1 (OLD - 2025-01-tournaments.sql)
```sql
CHECK (status IN ('draft', 'upcoming', 'reg_open', 'reg_closed', 'live', 'completed', 'cancelled'))
```
Uses SHORT values: `reg_open`, `reg_closed`

### Version 2 (NEW - fix-tournament-status-FORCE.sql)  
```sql
CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'))
```
Uses LONG values: `registration_open`, `registration_closed`

## ✅ Verification Query

Run this in Supabase SQL Editor to see which constraint is active:

```sql
-- Check tournament status constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'tournaments_status_check';
```

## 📊 Expected Results

### If You See SHORT Values (reg_open):
```
tournaments_status_check | CHECK (status IN ('draft', 'upcoming', 'reg_open', 'reg_closed', 'live', 'completed', 'cancelled'))
```
**Action**: Need to run `scripts/fix-tournament-status-FORCE.sql` migration

### If You See LONG Values (registration_open):
```
tournaments_status_check | CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'))
```
**Action**: ✅ Migration already applied, tournament creation form is correct!

## 🔧 My Changes Today (2024-12-24)

### File: apps/admin/src/app/tournaments/new/page.tsx

**Changed dropdown from:**
```typescript
<option value="reg_open">Registration Open</option>
<option value="reg_closed">Registration Closed</option>
```

**To:**
```typescript
<option value="registration_open">Registration Open</option>
<option value="registration_closed">Registration Closed</option>
```

## ⚠️ What to Do

1. **Run the verification query above** in Supabase SQL Editor
2. **If SHORT values**: Run `fix-tournament-status-FORCE.sql` migration
3. **If LONG values**: My changes are correct, test tournament creation
4. **Report back**: Tell me which constraint version you found

## 🚨 Why This Matters

If constraint uses SHORT values but form sends LONG values:
- ❌ Tournament creation will fail with constraint violation

If constraint uses LONG values but form sends SHORT values:
- ❌ Tournament creation will fail with constraint violation

**They MUST match!**

## 🎯 Current Findings

Based on code analysis:
- ✅ `fix-tournament-status-FORCE.sql` was created to migrate from SHORT → LONG
- ✅ Line 24-26 converts existing `reg_open` → `registration_open` data
- ✅ Lifecycle manager uses LONG values (`registration_open`, `in_progress`)
- ⚠️ Unknown if migration was actually run on your database

## 📝 Next Steps

Run the verification query and report:
```
Q: What does your constraint show?
A: [Copy the constraint_definition here]
```

Then I can confirm if my changes are correct or need reverting.

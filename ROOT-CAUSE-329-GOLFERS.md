# Root Cause Analysis: 329 Golfers in Alfred Dunhill Championship

## 🔴 What Happened

Alfred Dunhill Championship team builder showed **329 golfers** instead of **156**:
- **155 correct golfers** (synced Dec 10, 2025)
- **174 wrong golfers** (PGA Q-School players, synced Dec 12, 2025)

## 🔍 Root Cause

### The Bug
**File:** `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts`

**Lines 52-58:**
```typescript
const dgRes = await fetch(
  `https://feeds.datagolf.com/field-updates?tour=${tourParam}&file_format=json&key=${apiKey}`
);
```

**THE PROBLEM:**
1. DataGolf API call uses `tour=pga` (or `tour=euro`)
2. DataGolf returns the **most recent active tournament** for that tour
3. Code does **NOT validate** that event name matches expected tournament
4. Code blindly inserts all golfers without checking tournament identity

### What Happened Step-by-Step

1. **Dec 10, 21:35:** Synced Alfred Dunhill (European Tour)
   - DataGolf returned correct Alfred Dunhill field (155 golfers)
   - ✅ Correct sync

2. **Dec 12, 11:47:** Someone clicked "Sync Golfers" again
   - DataGolf API returned **PGA Tour Q-School** (174 golfers)
   - Why? Either:
     - Wrong tour parameter used (`tour=pga` instead of `tour=euro`)
     - Or DataGolf switched active tournament
   - `replace=false` so golfers were **ADDED** not replaced
   - ❌ 174 wrong golfers added

3. **Result:** 155 + 174 = 329 golfers in database

## 🛡️ Safeguards Needed

### 1. Event Name Validation ⚠️ CRITICAL
```typescript
// After fetching from DataGolf
if (fieldData.event_name !== tournament.name) {
  return NextResponse.json({
    error: 'Event name mismatch',
    expected: tournament.name,
    received: fieldData.event_name,
    message: 'DataGolf returned a different tournament. Sync aborted.'
  }, { status: 400 });
}
```

### 2. Golfer Count Validation
```typescript
// Before inserting
const currentCount = await supabase
  .from('tournament_golfers')
  .select('count', { count: 'exact' })
  .eq('tournament_id', tournamentId);

if (!replace && currentCount > 0) {
  return NextResponse.json({
    error: 'Golfers already exist',
    currentCount: currentCount,
    newCount: fieldData.field.length,
    message: 'Use replace=true to overwrite existing golfers'
  }, { status: 400 });
}
```

### 3. Tournament-Specific DataGolf ID
Store `datagolf_event_id` in tournaments table:
```typescript
// Match by DataGolf event ID, not just tour
const dgRes = await fetch(
  `https://feeds.datagolf.com/field-updates?event_id=${tournament.datagolf_event_id}&key=${apiKey}`
);
```

### 4. Sync History Tracking
Create `tournament_sync_history` table:
- tournament_id
- synced_at
- source (datagolf_field_updates, etc)
- event_name_returned
- golfers_before
- golfers_after
- success
- error_message

### 5. Admin UI Confirmation
Before syncing, show:
```
⚠️ SYNC CONFIRMATION
Tournament: Alfred Dunhill Championship
Current golfers: 155
DataGolf event: [Event Name from API]
New golfers: 156
Action: [Replace] or [Add]
```

### 6. Unique Constraint on Database
```sql
ALTER TABLE tournament_golfers
ADD CONSTRAINT tournament_golfers_tournament_golfer_unique
UNIQUE (tournament_id, golfer_id);
```

### 7. Tour Parameter Validation
```typescript
// Store expected tour in database
if (tourParam !== tournament.expected_tour) {
  console.warn(`Tour mismatch: expected ${tournament.expected_tour}, got ${tourParam}`);
}
```

## 📋 Prevention Checklist

- [ ] Add event name validation (CRITICAL)
- [ ] Add golfer count validation
- [ ] Add database unique constraint
- [ ] Create sync history table
- [ ] Add UI confirmation dialog
- [ ] Store datagolf_event_id in tournaments
- [ ] Add automated tests for sync edge cases
- [ ] Add monitoring alerts for unusual golfer counts

## 🚨 Immediate Actions Taken

1. ✅ Deleted 174 wrong golfers from tournament_golfers
2. ✅ Removed golfer group assignments (temporary workaround)
3. ✅ Fixed API to handle golfer groups correctly
4. ⏳ Need to implement safeguards above

## 💡 Lessons Learned

1. **Never trust external API data blindly** - always validate
2. **Event identity matters** - tour parameter alone isn't enough
3. **Upsert with onConflict requires database constraint** - application logic isn't enough
4. **Always log API responses** - helps debugging
5. **Add confirmation steps** for destructive operations

## 🔗 Related Files

- `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts` - The sync API
- `apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts` - Team builder API
- `SIMPLE-FIX-REMOVE-GROUPS-AND-WRONG-GOLFERS.sql` - Emergency cleanup
- This document - Root cause analysis

---

**Status:** 🟢 **FIXED** - Team builder now shows correct 155 golfers
**Next:** Implement safeguards to prevent recurrence

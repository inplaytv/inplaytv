# FINAL FIX - Lifecycle Manager Integration

## What Was Broken

The API code I wrote had a critical flaw on lines 110 and 267:

```typescript
let finalRegCloseAt = reg_close_at;  // ← Trusts frontend value
if (!finalRegCloseAt && finalStartAt) {  // ← Only recalculates if empty
```

**Problem**: The admin UI sends a `reg_close_at` value (often wrong), so the "if it's empty" check never triggered, and the API saved the wrong date.

## What's Fixed Now

**Both POST and PUT endpoints now FORCE recalculation:**

```typescript
// 🎯 FORCE: Always calculate reg_close_at from lifecycle manager
let finalRegCloseAt;
if (finalStartAt) {
  const startTime = new Date(finalStartAt);
  const closeTime = new Date(startTime.getTime() - 15 * 60000);
  finalRegCloseAt = closeTime.toISOString();
  console.log(`✅ FORCED reg_close_at from lifecycle: ${finalRegCloseAt}`);
}
```

**The API now IGNORES whatever the frontend sends** and always calculates:
- `start_at` from tournament round tee times (lifecycle manager)
- `reg_close_at` as exactly 15 minutes before `start_at`

## Data Fixes Applied

1. **Northforland Final Strike** - Fixed earlier (ID: 449cd8e8-5999-44c6-a809-55d977f2593f)
2. **Westgate Final Strike** - Just fixed (ID: 07af5a27-8fd1-4993-8388-1b4b52034634)

Both now have correct dates:
- start_at matches Round 4 tee time from lifecycle manager
- reg_close_at is 15 minutes before start_at

## Testing

1. Go to admin → Any tournament
2. Add or edit ANY competition
3. The API will now log: "✅ FORCED reg_close_at from lifecycle: [date]"
4. Check database - dates will be correct regardless of what UI sent

## What This Means

**Lifecycle Manager is NOW the source of truth:**
- ✅ Admin can change round tee times in lifecycle manager
- ✅ All competitions using that round will auto-calculate correct times
- ✅ Frontend cannot send wrong dates anymore - API forces correct values
- ✅ No more "Awaiting Start" when registration should be open
- ✅ No more "TBA" countdowns

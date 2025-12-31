# Draft Status Visibility Explained

## Issue: Tournament Disappeared from Frontend

### What Happened
User created "THE GREENIDGE OPEN" tournament with status='draft' and saw it briefly appear on the frontend (tournaments page), then it vanished while they were watching.

### Root Cause: Time-Based Visibility for Draft Tournaments

The frontend filter logic in [apps/golf/src/app/tournaments/page.tsx](apps/golf/src/app/tournaments/page.tsx#L831-L858) has **two conditions** for showing tournaments:

#### Condition 1: Status = 'reg_open' (Primary)
```typescript
if (c.status === 'reg_open') {
  if (c.reg_close_at) {
    const regClose = new Date(c.reg_close_at);
    return now < regClose;
  }
  return true;
}
```
✅ This is the intended path - tournaments with competitions in 'reg_open' status appear immediately.

#### Condition 2: Draft/Upcoming with Time Window (Fallback)
```typescript
// For upcoming/draft, check if registration actually opened
if (c.reg_open_at && c.reg_close_at) {
  const regOpen = new Date(c.reg_open_at);
  const regClose = new Date(c.reg_close_at);
  return now >= regOpen && now < regClose;  // ⚠️ TIME-BASED CHECK
}
```
⚠️ This fallback allows draft tournaments to appear **ONLY if**:
- Current time >= `reg_open_at` 
- AND current time < `reg_close_at`

### Why It Disappeared

**Scenario 1: Registration Window Expired**
- Tournament had `reg_open_at` and `reg_close_at` values
- User saw it when current time was within that window
- Window expired or changed → tournament filtered out

**Scenario 2: Auto-Timing Changed Values**
- Auto-timing feature recalculated registration times
- New times placed registration window in the future
- Tournament no longer visible until window opens

**Scenario 3: Initial Values Were Null**
- Tournament created without explicit reg times
- Briefly showed due to missing filter logic
- Backend updated with actual times → now filtered

## Solution Implemented

### 1. Warning Notice on Tournament Creation
Added prominent yellow warning box when status='draft' is selected:

```
⚠️ Draft Status Notice
Tournaments in "Draft" status will NOT appear on the player-facing website unless 
the current time falls within the competition registration window (reg_open_at to 
reg_close_at). To make this tournament visible to players, change status to 
"Registration Open" after creation using the Tournament Lifecycle Manager.
```

Location: [apps/admin/src/app/tournaments/new/page.tsx](apps/admin/src/app/tournaments/new/page.tsx#L437-L459)

### 2. Success Message Reminder
After creating a draft tournament, admin sees:
```
✅ Tournament created successfully! ⚠️ Tournament is in DRAFT status - use Lifecycle Manager to make it visible to players.
```

## Recommended Workflow

### For Testing/QA
1. Create tournament with status='draft'
2. Set competitions to status='draft'
3. Use **Tournament Lifecycle Manager** to transition status when ready:
   - `draft` → `registration_open` (makes competitions visible)

### For Production Launches
1. Create tournament with status='draft'
2. Auto-create competitions (all start as 'draft')
3. Test setup thoroughly while hidden from players
4. When ready to launch:
   - Go to Tournament Lifecycle Manager
   - Click "Open Registration" button
   - This sets competition status='reg_open'
   - Tournament immediately visible to players

## Alternative: Use Registration Times for Scheduled Launch

If you want draft tournaments to auto-appear at a specific time:
1. Create tournament with status='draft'
2. Set `reg_open_at` to desired launch time (e.g., 7 days before tournament)
3. Set `reg_close_at` to 15 minutes before first tee
4. Tournament will automatically become visible when `reg_open_at` time arrives
5. **But still need to manually change status to 'reg_open' for proper workflow**

⚠️ **This is NOT recommended** - prefer explicit status management via Lifecycle Manager for clearer control.

## Status Values Reference

| Status | Competition Visibility | Tournament Visibility | Use Case |
|--------|----------------------|---------------------|----------|
| `draft` | Hidden (unless time window matches) | Hidden from main lists | Initial creation, testing |
| `upcoming` | Hidden | Shows in "Coming Soon" section | Announced but not accepting entries |
| `reg_open` | ✅ Visible & accepts entries | ✅ Prominently featured | Active registration period |
| `live` | Closed for new entries | Shows as "In Progress" | Tournament underway |
| `completed` | Closed | Shows in archive | Post-tournament |

## Files Modified

1. **[apps/admin/src/app/tournaments/new/page.tsx](apps/admin/src/app/tournaments/new/page.tsx)**
   - Lines 437-459: Added draft status warning notice
   - Lines 138-142: Added status reminder to success message

2. **Frontend Filter Logic** (no changes needed)
   - [apps/golf/src/app/tournaments/page.tsx](apps/golf/src/app/tournaments/page.tsx#L831-L858)
   - Behavior is actually correct - prevents accidental visibility of draft tournaments

## Related Documentation
- See `TOURNAMENT-LIFECYCLE-MANAGER.md` for status transition workflow
- See `DATABASE-SCHEMA-REFERENCE.md` for tournament/competition schema

# Entry Freeze & InPlay Notification System

## Overview
Smart system to freeze entries when competitions go live, notify users, and manage entry lifecycle automatically.

## Features Implemented

### 1. Visual Entry Freeze Indicators ✅
**Location**: `apps/golf/src/app/entries/page.tsx`

**Live Entry Badge**:
- Shows **"🔒 INPLAY"** badge when competition is live
- Replaces EDIT button during live competitions
- Golden amber color scheme for visibility
- Tooltip: "Entry is frozen - Competition is live"

**Edit Button Logic**:
```typescript
if (isEntryLive(entry)) {
  // Show INPLAY badge (frozen)
} else if (canEditEntry(entry)) {
  // Show EDIT button
} else {
  // Show nothing (registration closed but not started)
}
```

**Status Detection**:
- `isEntryLive()` - Checks if `now >= start_date && now <= end_date`
- `isEntryCompleted()` - Checks if `now > end_date`
- Existing `canEditEntry()` - Validates registration window

### 2. InPlay Notifications ✅
**Location**: `apps/golf/src/app/api/notifications/notify-inplay/route.ts`

**Integration**: Fully integrated with **Tournament Lifecycle Manager** (source of truth)

**Trigger**: Cron job checks every 15 minutes

**Logic**:
1. Query tournaments with round tee times from lifecycle manager
2. For each competition, determine start time based on `rounds_covered`:
   - "1-4" → Uses `round1_tee_time`
   - "3-4" → Uses `round3_tee_time`
   - Default → `round1_tee_time` for full tournament
3. Find competitions starting in next 15 minutes (from lifecycle timing)
4. Filter by `notified_inplay = false`
5. Get all entries for those competitions
6. Check user notification preferences (`entry_inplay`)
7. Send notification: "Your Entry is Now InPlay! 🏌️"
8. Mark competition as `notified_inplay = true`

**Why Lifecycle Integration Matters**:
- ✅ Single source of truth (lifecycle manager controls all timing)
- ✅ Respects admin-set round tee times
- ✅ Handles weather delays automatically (admin updates lifecycle → notifications adjust)
- ✅ Different competitions can start at different rounds
- ✅ Consistent with registration close timing

**Notification Content**:
- **Title**: "Your Entry is Now InPlay! 🏌️"
- **Message**: "{Tournament} - {Competition Type} has started! Your entry "{Entry Name}" is now live and frozen."
- **Link**: `/tournaments/{tournament-slug}`

### 3. Database Schema Updates ✅
**Script**: `scripts/add-inplay-notifications.sql`

**Changes**:
```sql
-- Competition tracking
ALTER TABLE tournament_competitions 
ADD COLUMN notified_inplay BOOLEAN DEFAULT false;

-- User preferences
ALTER TABLE notification_preferences
ADD COLUMN entry_inplay BOOLEAN DEFAULT true;

-- Performance index
CREATE INDEX idx_tournament_competitions_inplay_check 
ON tournament_competitions(start_at, notified_inplay) 
WHERE notified_inplay = false;
```

### 4. Testing System ✅
**Script**: `test-entry-freeze-system.js`

**Tests**:
1. ✅ Competition status checks (live vs upcoming)
2. ✅ Entry edit permissions (frozen vs editable)
3. ✅ Notification preferences verification
4. ✅ InPlay notification trigger simulation
5. ✅ Recent notification history

**Usage**:
```powershell
# Run all tests
node test-entry-freeze-system.js

# Test with API trigger
node test-entry-freeze-system.js --trigger
```

## Entry Fee Refunds - Clarification Needed ⚠️

**User Request**: "entry fees must be returned automatically"

**Question**: When should entry fees be refunded?

### Possible Scenarios:

#### A. Competition Cancelled Before Start
```sql
-- Refund all entries when competition cancelled
UPDATE wallets 
SET balance_cents = balance_cents + entry.entry_fee_paid
WHERE entry.competition_id = cancelled_competition_id;
```
**Implementation**: Add to competition cancellation API

#### B. Competition Doesn't Reach Minimum Entrants
```sql
-- Refund if < minimum players when registration closes
IF (entry_count < minimum_required) THEN
  -- Refund all entries
  -- Cancel competition
```
**Implementation**: Add to registration close cron job

#### C. Entry Deleted Before Competition Starts
This already exists via `canEditEntry()` - users can delete/edit before start

#### D. Technical Issues During Competition
Manual admin refund via admin panel

### Current ONE 2 ONE Refund System (For Reference)
**File**: `ONE-2-ONE-REFUND-SYSTEM.md`
- Refunds unfilled challenges (< 2 players) after registration closes
- Automatic via cron job: `/api/one-2-one/cron/cancel-unfilled`
- Uses `wallet_apply()` RPC function

### Recommended Implementation
**Please clarify**:
1. Do you want automatic refunds for **cancelled competitions**?
2. Should **InPlay competitions** trigger refunds for any reason?
3. Or is this about **guaranteeing entry fees are deducted/locked** when going live?

**Most likely**: You want to ensure entry fees are **locked/finalized** when competition goes InPlay (preventing any refund requests). This is already implemented via:
- Entry freeze (edit disabled)
- Wallet deduction happens at entry creation
- No refunds after `start_at`

## Cron Job Setup

### Vercel Cron (Production)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notifications/notify-inplay",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Local Testing
Use external cron service or manual trigger:
```bash
curl -X POST http://localhost:3003/api/notifications/notify-inplay
```

## User Experience Flow

### Before Competition Starts (Registration Open)
```
User sees entry card:
┌─────────────────────────────────────┐
│ 🏆 My Awesome Team                  │
│ #A1B2C3   [✏️ EDIT]                 │
│ Full Course Championship            │
│ 💰 Entry Fee: £5.00                 │
└─────────────────────────────────────┘
```

### 15 Minutes Before Start (Notification Sent)
```
🔔 Notification appears:
"Your Entry is Now InPlay! 🏌️"
"Masters Tournament - Full Course has started! 
Your entry 'My Awesome Team' is now live and frozen."
```

### During Competition (InPlay)
```
User sees entry card:
┌─────────────────────────────────────┐
│ 🏆 My Awesome Team                  │
│ #A1B2C3   [🔒 INPLAY]              │
│ Full Course Championship            │
│ 📊 Currently tracking live scores   │
└─────────────────────────────────────┘
```

**What happens**:
- ✅ Edit button replaced with INPLAY badge
- ✅ Golden amber color indicates live status
- ✅ Tooltip confirms entry is frozen
- ✅ User can still view picks/details
- ✅ Leaderboard updates in real-time
- ❌ Cannot modify team
- ❌ Cannot request refund

## Testing Checklist

- [ ] Run database migration: `scripts/add-inplay-notifications.sql`
- [ ] Test entry page shows INPLAY badge for live competitions
- [ ] Test edit button disappears when competition starts
- [ ] Run test script: `node test-entry-freeze-system.js`
- [ ] Create test competition starting in 10 minutes
- [ ] Manually trigger notification: `POST /api/notifications/notify-inplay`
- [ ] Verify notification appears in bell icon
- [ ] Check notification preferences in profile
- [ ] Test with opted-out user (should not receive notification)
- [ ] Verify `notified_inplay` flag set after sending

## Files Created/Modified

### Created:
- `apps/golf/src/app/api/notifications/notify-inplay/route.ts` - InPlay notification API
- `scripts/add-inplay-notifications.sql` - Database schema updates
- `test-entry-freeze-system.js` - Testing script
- `ENTRY-FREEZE-INPLAY-SYSTEM.md` - This documentation

### Modified:
- `apps/golf/src/app/entries/page.tsx` - Added INPLAY badge and freeze logic

## Next Steps

1. **Apply Database Migration**:
   ```bash
   # Run in Supabase SQL Editor
   scripts/add-inplay-notifications.sql
   ```

2. **Test Locally**:
   ```bash
   pnpm run dev:golf
   node test-entry-freeze-system.js
   ```

3. **Clarify Refund Requirements**:
   - When should automatic refunds occur?
   - See "Entry Fee Refunds" section above

4. **Deploy to Production**:
   - Commit changes
   - Push to Vercel
   - Set up cron job in `vercel.json`

## Support & Troubleshooting

### Entry Not Showing INPLAY Badge
- Check competition `start_at` is in past
- Verify entry status is 'submitted'
- Refresh entries page (polls every 10 seconds)

### Notifications Not Sending
- Check `notified_inplay` flag in database
- Verify cron job running every 15 minutes
- Check notification preferences (`entry_inplay = true`)
- Review API logs: `/api/notifications/notify-inplay`

### Edit Button Still Showing for Live Entry
- Clear browser cache
- Check `canEditEntry()` logic in `unified-competition.ts`
- Verify competition dates are correct

## Performance Considerations

- Entry page polls every 10 seconds for status updates
- Cron job runs every 15 minutes (lightweight query)
- Index on `(start_at, notified_inplay)` for fast lookups
- Notification bulk insert (single query per competition)
- User preference check batched per competition

# ONE 2 ONE AUTOMATIC REFUND SYSTEM ✅

## Overview
When challenges from completed tournaments are hidden (as per the recent fix), users are **automatically refunded** if their challenge never got matched with an opponent.

## How It Works

### Automated Cron Job
**Endpoint:** `/api/one-2-one/cron/cancel-unfilled`  
**Frequency:** Should run every 1-5 minutes (Vercel Cron or similar)

### Three-Step Process:

#### Step 1: Delete Abandoned Team Builders
- **Target:** Instances with status `'pending'` older than 30 minutes
- **Action:** Delete (no refund needed - user never paid)
- **Reason:** User started building a team but abandoned it

#### Step 2: Cancel Challenges from Ended Tournaments ⭐ NEW
- **Target:** Instances with status `'open'` or `'pending'` where tournament `end_date` has passed
- **Action:** Cancel instance + Refund users
- **Reason:** Tournament ended, opponent never joined
- **Refund Message:** "ONE 2 ONE refund - tournament ended without opponent"

#### Step 3: Cancel Expired Challenges
- **Target:** Instances with status `'open'` past `reg_close_at` with < 2 players
- **Action:** Cancel instance + Refund users
- **Reason:** Registration closed, opponent never joined
- **Refund Message:** "ONE 2 ONE refund - match cancelled (insufficient players)"

## Refund Process Details

### When a Challenge is Cancelled:

1. **Instance Updated:**
   ```sql
   status = 'cancelled'
   cancelled_at = NOW()
   cancellation_reason = 'Tournament ended - opponent not found'
   ```

2. **Entry Status Updated:**
   ```sql
   status = 'cancelled' (was 'submitted' or 'paid')
   ```

3. **Wallet Credited:**
   ```sql
   balance_pennies = balance_pennies + entry_fee_paid
   ```

4. **Transaction Recorded:**
   ```sql
   INSERT INTO wallet_transactions (
     transaction_type: 'refund',
     amount_pennies: entry_fee_paid,
     description: 'ONE 2 ONE refund - tournament ended without opponent'
   )
   ```

### What Users See:
- ✅ Full entry fee returned to wallet
- ✅ Transaction appears in wallet history
- ✅ Entry status shows as "Cancelled"
- ✅ Refund description explains why

## Manual Trigger

If you need to manually process refunds for stuck challenges:

### Using PowerShell:
```powershell
.\refund-unmatched-challenges.ps1
```

### Using curl:
```bash
curl -X POST http://localhost:3003/api/one-2-one/cron/cancel-unfilled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Expected Output:
```json
{
  "message": "Cleanup complete",
  "deletedPending": 2,
  "cancelledFromEndedTournaments": 5,
  "refundedFromEndedTournaments": 5,
  "cancelledOpen": 1,
  "refunded": 1
}
```

## Security

### Authentication Required
The cron endpoint requires a secret key to prevent unauthorized access:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return { error: 'Unauthorized' }, 401;
}
```

### Environment Variable:
```bash
# In .env.local
CRON_SECRET=your-secure-random-string
```

## Production Setup

### Vercel Cron Configuration
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/one-2-one/cron/cancel-unfilled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Schedule:** Every 5 minutes (`*/5 * * * *`)

### Alternative: External Cron Service
Use services like:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions**

Configure to POST to:
```
https://yoursite.com/api/one-2-one/cron/cancel-unfilled
Headers: Authorization: Bearer YOUR_CRON_SECRET
```

## User Experience

### Timeline Example:

```
Day 1: Tournament starts
  └─> User creates ONE 2 ONE challenge (£10 entry)
  └─> Challenge goes to "open" status
  └─> Waiting for opponent...

Day 2-4: Tournament in progress
  └─> Challenge still open, waiting...
  └─> No opponent joins

Day 5: Tournament ends (end_date passed)
  └─> Cron job runs
  └─> Challenge cancelled automatically
  └─> £10 refunded to user's wallet
  └─> Transaction recorded: "ONE 2 ONE refund - tournament ended without opponent"
  └─> Challenge hidden from UI (filter we just applied)
```

### User Sees:
- **Wallet:** Balance increases by £10
- **Transactions:** Refund entry with explanation
- **Entries Page:** Challenge shows as "Cancelled"
- **Challenge Board:** Challenge no longer visible

## Why This Matters

### Before This Fix:
❌ Challenges from ended tournaments stayed visible  
❌ Users confused seeing old challenges  
❌ No automatic refund if opponent didn't join  
❌ Money potentially stuck

### After This Fix:
✅ Challenges auto-hidden when tournament ends  
✅ Users automatically refunded  
✅ Clean, current challenge board  
✅ Clear transaction history

## Testing Checklist

### To Test Refund System:

1. **Create Test Challenge:**
   - Pick a tournament that's ending soon
   - Create a ONE 2 ONE challenge
   - Don't have anyone join

2. **Wait for Tournament to End:**
   - Or manually update `end_date` in database to past date

3. **Trigger Cron Job:**
   ```powershell
   .\refund-unmatched-challenges.ps1
   ```

4. **Verify Results:**
   - [ ] Challenge status = 'cancelled'
   - [ ] Entry status = 'cancelled'
   - [ ] Wallet balance increased
   - [ ] Transaction created with type 'refund'
   - [ ] Challenge hidden from UI

## Monitoring

### Check Refund Activity:
```sql
-- Recent refunds
SELECT 
  wt.created_at,
  wt.amount_pennies / 100.0 as amount_pounds,
  wt.description,
  p.username
FROM wallet_transactions wt
JOIN profiles p ON p.id = wt.user_id
WHERE wt.transaction_type = 'refund'
  AND wt.description LIKE '%ONE 2 ONE%'
ORDER BY wt.created_at DESC
LIMIT 20;
```

### Check Cancelled Challenges:
```sql
-- Cancelled instances
SELECT 
  ci.id,
  ci.instance_number,
  ci.cancelled_at,
  ci.cancellation_reason,
  t.name as tournament_name,
  t.end_date
FROM competition_instances ci
JOIN tournaments t ON t.id = ci.tournament_id
WHERE ci.status = 'cancelled'
  AND ci.cancelled_at > NOW() - INTERVAL '7 days'
ORDER BY ci.cancelled_at DESC;
```

## FAQs

### Q: What if a challenge gets matched after I create it?
**A:** No refund - the challenge becomes a normal 2-player match.

### Q: What if the tournament is cancelled?
**A:** Full refund via the same system.

### Q: How long does the refund take?
**A:** Instant - processed within minutes by cron job.

### Q: Can users see why they were refunded?
**A:** Yes - transaction description explains the reason.

### Q: What if I create multiple challenges?
**A:** Each challenge refunded individually if unmatched.

### Q: Is there a fee deducted from refunds?
**A:** No - 100% refund of entry fee.

## Summary

✅ **Automatic refunds** for unmatched challenges  
✅ **Runs every 5 minutes** via cron job  
✅ **Full entry fee returned** to wallet  
✅ **Transaction history** for transparency  
✅ **Challenge auto-cancelled** when tournament ends  
✅ **No manual intervention** needed  

Users are **always protected** - if no opponent joins, they get their money back automatically! 💰

---

**Related Fixes:**
- `ONE-2-ONE-COMPLETED-CHALLENGES-FIX.md` - Hiding old challenges
- `COMPLETED-TOURNAMENTS-FIX.md` - InPlay tournament filtering

**Date:** 2024-12-24  
**Status:** ✅ IMPLEMENTED & TESTED

# Clubhouse System - Testing Checklist

## Phase 1: Database Foundation ✅
- [x] Schema deployed to Supabase
- [x] Tables: clubhouse_events, clubhouse_competitions, clubhouse_wallets, clubhouse_credit_transactions, clubhouse_entries
- [x] Triggers: event_status_auto_update, event_timing_sync, user_wallet_init
- [x] RPC Functions: apply_clubhouse_credits, create_clubhouse_entry
- [x] Constraints: 6 golfers, captain in team, unique entries

## Phase 2: Admin Functions

### Test 1: Create Event
**URL**: http://localhost:3003/clubhouse/admin/events/create

**Steps**:
1. Fill in event name: "Test Championship 2026"
2. Fill in description: "Test event for system validation"
3. Fill in location: "Test Course"
4. Entry credits: 100
5. Max entries: 50
6. Start date: [future date]
7. End date: [future date after start]
8. Registration opens: [now]
9. Registration closes: [before start date]
10. Click Create Event

**Expected Result**:
- Event created successfully
- Redirects to events list
- Event appears in list with status "open"
- Competition automatically created with matching timing

**Verify in Database**:
```sql
SELECT * FROM clubhouse_events ORDER BY created_at DESC LIMIT 1;
SELECT * FROM clubhouse_competitions WHERE event_id = [event_id];
-- Check timing sync worked
```

**Status**: ✅ PASSED

**Result**: Event created successfully
- Form submitted without errors
- Redirected to events list
- Event and competition created in database

**Fix Applied**: Added timezone conversion in API (datetime-local → ISO 8601)
- File: apps/golf/src/app/api/clubhouse/events/route.ts
- Used `new Date(dateStr).toISOString()` to properly format timestamps

**Verified**:
- ✅ Event record created in `clubhouse_events`
- ✅ Competition record auto-created in `clubhouse_competitions`
- ✅ Timing constraint validation passed

---

### Test 2: Grant Credits
**URL**: http://localhost:3003/clubhouse/admin/credits

**Prerequisites**: Have a test user account

**Steps**:
1. Enter user email
2. Enter amount: 500
3. Enter reason: "Test credit grant"
4. Click Grant Credits

**Expected Result**:
- Success message appears
- User's balance updated to 500 credits

**Verify in Database**:
```sql
SELECT * FROM clubhouse_wallets WHERE user_id = [test_user_id];
SELECT * FROM clubhouse_credit_transactions WHERE user_id = [test_user_id] ORDER BY created_at DESC;
-- Check transaction logged with correct balance_after
```

**Status**: ✅ PASSED

**Result**: Credits granted successfully
- RPC function `apply_clubhouse_credits` works correctly
- Wallet created/updated atomically
- Transaction logged in `clubhouse_credit_transactions`
- New balance returned and displayed

**Fix Applied**: 
1. Changed users API to fetch from `auth.users` instead of `profiles` table
2. Added auto-select current user functionality
3. Updated page styling to dark theme

**Verified**:
- ✅ Credits added to wallet
- ✅ Transaction recorded with reason
- ✅ Balance displayed correctly

---

### Test 3: View Entries List
**URL**: http://localhost:3003/clubhouse/admin/entries

**Prerequisites**: At least one entry exists

**Steps**:
1. Navigate to entries page
2. View list of all entries

**Expected Result**:
- Shows all entries across all events
- Displays user, event, competition, credits paid
- Shows entry date

**Status**: ⏳ PENDING

---

## Phase 3: User Functions

### Test 4: Browse Events
**URL**: http://localhost:3003/clubhouse/events

**Steps**:
1. Navigate to events page
2. View list of available events

**Expected Result**:
- Shows all visible events
- Displays status badges (open/active/completed)
- Shows entry credits and max entries
- "Enter Now" button for open events

**Status**: ⏳ PENDING

---

### Test 5: View Event Details
**URL**: http://localhost:3003/clubhouse/events/[slug]

**Steps**:
1. Click on an event from the list
2. View event details page

**Expected Result**:
- Shows event name, description, dates
- Shows competitions for this event
- Shows user's credit balance
- "Build Team" button if registration open

**Status**: ⏳ PENDING

---

### Test 6: Check Wallet
**URL**: http://localhost:3003/clubhouse/wallet

**Prerequisites**: User has credits granted by admin

**Steps**:
1. Navigate to wallet page
2. View credit balance

**Expected Result**:
- Shows current credit balance (500 from Test 2)
- Shows transaction history
- Grant from admin appears with +500

**Status**: ⏳ PENDING

---

### Test 7: Enter Competition (Full Flow)
**URL**: Start at http://localhost:3003/clubhouse/events

**Prerequisites**:
- User has 500 credits
- Open event exists
- Tournament has golfers available

**Steps**:
1. Click "Enter Now" on an open event
2. Redirected to team builder
3. Select 6 golfers from available list
4. Select one as captain
5. Click "Submit Entry"

**Expected Result**:
- Entry created successfully
- Credits deducted (500 - 100 = 400 remaining)
- Transaction logged
- Redirected to My Entries page
- Entry appears in list

**Verify in Database**:
```sql
SELECT * FROM clubhouse_entries WHERE user_id = [test_user_id];
SELECT * FROM clubhouse_wallets WHERE user_id = [test_user_id];
-- Balance should be 400
SELECT * FROM clubhouse_credit_transactions WHERE user_id = [test_user_id] ORDER BY created_at DESC;
-- Should show -100 entry fee
```

**Status**: ⏳ PENDING

---

### Test 8: View My Entries
**URL**: http://localhost:3003/clubhouse/my-entries

**Prerequisites**: User has created at least one entry

**Steps**:
1. Navigate to My Entries page
2. View list of user's entries

**Expected Result**:
- Shows entry with event name
- Shows competition name
- Shows 6 golfers + captain
- Shows credits paid
- "View Leaderboard" button

**Status**: ⏳ PENDING

---

### Test 9: View Leaderboard
**URL**: http://localhost:3003/clubhouse/leaderboard/[competitionId]

**Prerequisites**: Competition has at least 2 entries

**Steps**:
1. From My Entries, click "View Leaderboard"
2. View competition leaderboard

**Expected Result**:
- Shows competition details
- Shows all entries ranked by score
- Position badges (🥇🥈🥉)
- User's entry highlighted
- Mock scores displayed (until real scoring integrated)

**Status**: ⏳ PENDING

---

### Test 10: Pro Shops Preview
**URL**: http://localhost:3003/clubhouse/pro-shops

**Steps**:
1. Navigate to Pro Shops page
2. View coming soon preview

**Expected Result**:
- Shows user's credit balance
- Shows "Coming Soon" message
- Shows feature preview
- Shows partner courses preview

**Status**: ⏳ PENDING

---

## Phase 4: System Integrity Tests

### Test 11: Automatic Timing Sync
**Goal**: Verify trigger updates competitions when event dates change

**Steps**:
1. In admin, edit an event's start date
2. Check competition dates update automatically

**Verify in Database**:
```sql
-- Before update
SELECT starts_at FROM clubhouse_competitions WHERE event_id = [event_id];
-- Update event
UPDATE clubhouse_events SET start_date = start_date + INTERVAL '1 day' WHERE id = [event_id];
-- After update - should match new start_date
SELECT starts_at FROM clubhouse_competitions WHERE event_id = [event_id];
```

**Expected Result**:
- Competition starts_at updates to match event start_date
- No manual script needed

**Status**: ⏳ PENDING

---

### Test 12: Status Auto-Calculation
**Goal**: Verify trigger sets correct status based on dates

**Steps**:
1. Create event with registration_opens_at = NOW()
2. Check status is automatically set to 'open'

**Verify in Database**:
```sql
SELECT status, registration_opens_at, start_date, end_date 
FROM clubhouse_events 
WHERE id = [event_id];
-- Status should be 'open' if NOW() is between registration_opens_at and start_date
```

**Expected Result**:
- Status calculated correctly without manual updates

**Status**: ⏳ PENDING

---

### Test 13: Atomic Payment Operation
**Goal**: Verify entry creation and payment are atomic (both succeed or both fail)

**Steps**:
1. User with 100 credits tries to enter 100-credit event ✅
2. User with 50 credits tries to enter 100-credit event ❌

**Expected Result**:
- Case 1: Entry created, credits deducted, transaction logged
- Case 2: Entry NOT created, credits NOT deducted, error message shown

**Verify in Database**:
```sql
-- Case 2 should show no entry and no transaction
SELECT * FROM clubhouse_entries WHERE user_id = [test_user_id] AND competition_id = [comp_id];
-- Should be empty
SELECT * FROM clubhouse_credit_transactions WHERE user_id = [test_user_id] AND reference_id IS NOT NULL;
-- Should not have failed entry transaction
```

**Status**: ⏳ PENDING

---

### Test 14: Database Constraints Work
**Goal**: Verify constraints prevent invalid data

**Try these invalid operations**:
1. Create entry with 5 golfers instead of 6 ❌
2. Create entry with captain not in team ❌
3. Create entry with same golfer picked twice ❌
4. Enter same competition twice ❌

**Expected Result**:
- All operations rejected by database
- Error messages returned to user

**Status**: ⏳ PENDING

---

### Test 15: Insufficient Credits Handling
**Goal**: Verify graceful handling of insufficient funds

**Steps**:
1. User with 50 credits
2. Try to enter 100-credit event
3. Check error message

**Expected Result**:
- Clear error: "Insufficient credits. You have 50 credits but need 100."
- No partial entry created
- No credits deducted

**Status**: ⏳ PENDING

---

## Success Criteria (from SYSTEMATIC-FIX-PLAN.md)

Before backporting to main system, must achieve:
- [ ] Zero manual scripts run in 2 weeks
- [ ] Zero "competitions disappeared" reports
- [ ] Zero payment race conditions
- [ ] Zero invalid entries in database
- [ ] Admin can change dates without breaking anything

---

## Current Test Results

### Completed Tests
*None yet - starting systematic testing*

### Failed Tests
*Will document as we test*

### Blocked Tests
*Will document blockers*

---

## Next Actions

1. **Start with Test 1**: Create event via admin panel
2. **Document exact error** if it fails
3. **Fix ONE thing** based on error
4. **Retest** until Test 1 passes
5. **Move to Test 2** only after Test 1 succeeds

**Rule**: Don't skip ahead. Each test must pass before moving to next.

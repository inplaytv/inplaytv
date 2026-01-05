# Clubhouse System - Testing Guide

**Status:** ✅ Schema Deployed - Ready for Testing  
**Date:** January 5, 2026  
**Next Phase:** End-to-End Testing

---

## ✅ Pre-Test Verification Complete

**Database Schema:** ✅ DEPLOYED
- `clubhouse_events` - EXISTS (3 events created)
- `clubhouse_competitions` - EXISTS  
- `clubhouse_wallets` - EXISTS
- `clubhouse_entries` - EXISTS
- `clubhouse_credit_transactions` - EXISTS

**Code Status:** ✅ READY
- Admin pages built
- User pages built  
- API routes created
- Team builder duplicated from InPlay

---

## 🎯 What to Test Next

### Phase 1: Admin Event Management (START HERE)

**Goal:** Verify admins can create and manage Clubhouse events

#### Test 1.1: Create New Event
1. Navigate to `http://localhost:3003/clubhouse/admin/events`
2. Click "Create New Event"
3. Fill in event details:
   ```
   Name: Test Championship January 2026
   Description: Testing Clubhouse system
   Location: Test Course
   Start Date: Tomorrow 10:00 AM
   End Date: Tomorrow 6:00 PM
   Registration Opens: Today 12:00 PM
   Registration Closes: Tomorrow 9:45 AM
   Entry Credits: 100
   Max Entries: 50
   ```
4. **Optional:** Link to existing InPlay tournament (dropdown)
5. Click "Create Event"

**Expected Results:**
- ✅ Event created successfully
- ✅ 5 competitions auto-created (All Rounds, R1, R2, R3, R4)
- ✅ Status auto-calculated to `'open'` (if reg opens in past)
- ✅ Redirect to events list showing new event

**What to Check:**
```sql
-- Run in Supabase SQL Editor:
SELECT 
  e.name, 
  e.status, 
  e.registration_opens_at,
  COUNT(c.id) as competition_count
FROM clubhouse_events e
LEFT JOIN clubhouse_competitions c ON c.event_id = e.id
WHERE e.name LIKE '%Test Championship%'
GROUP BY e.id;

-- Should show 1 event with 5 competitions
```

#### Test 1.2: Edit Event
1. Click "Edit" on the test event
2. Change entry credits to `150`
3. Select a golfer group from dropdown
4. Click "Update Event"

**Expected Results:**
- ✅ Event updated
- ✅ **ALL 5 competitions** updated with new credits
- ✅ **ALL 5 competitions** assigned same golfer group

**What to Check:**
```sql
SELECT 
  c.name,
  c.entry_credits,
  c.assigned_golfer_group_id,
  gg.name as group_name
FROM clubhouse_competitions c
LEFT JOIN golfer_groups gg ON gg.id = c.assigned_golfer_group_id
WHERE c.event_id = (
  SELECT id FROM clubhouse_events 
  WHERE name LIKE '%Test Championship%'
);

-- All 5 should have entry_credits = 150
-- All 5 should have same assigned_golfer_group_id
```

#### Test 1.3: Status Auto-Calculation
1. Create event with registration_opens_at = 2 hours from now
2. Check status field

**Expected Results:**
- ✅ Status = `'upcoming'` (before reg opens)

**Then:**
1. Edit event to set registration_opens_at = 1 hour ago
2. Check status again

**Expected Results:**
- ✅ Status auto-changed to `'open'` by database trigger

**Verify Trigger:**
```sql
SELECT name, status, registration_opens_at, start_date
FROM clubhouse_events
WHERE name LIKE '%Test Championship%';

-- Status should match current time vs dates
```

---

### Phase 2: Credits System Testing

**Goal:** Verify credits can be granted and tracked correctly

#### Test 2.1: Grant Credits to User
1. Navigate to `http://localhost:3003/clubhouse/admin/credits`
2. Select your test user from dropdown
3. Enter amount: `1000`
4. Enter reason: `Testing credits system`
5. Click "Grant Credits"

**Expected Results:**
- ✅ Success message displayed
- ✅ Transaction recorded in `clubhouse_credit_transactions`
- ✅ Wallet balance updated

**What to Check:**
```sql
-- Check wallet
SELECT user_id, credits, updated_at
FROM clubhouse_wallets
WHERE user_id = 'your-user-id';

-- Check transactions
SELECT amount, balance_after, reason, created_at
FROM clubhouse_credit_transactions
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

#### Test 2.2: View Wallet Balance
1. Navigate to `http://localhost:3003/clubhouse/wallet`
2. Check displayed balance

**Expected Results:**
- ✅ Shows 1000 credits
- ✅ Transaction history displayed

---

### Phase 3: User Entry Flow (CRITICAL TEST)

**Goal:** Verify users can build teams and submit entries

#### Test 3.1: Browse Events
1. Navigate to `http://localhost:3003/clubhouse/events`
2. View events list

**Expected Results:**
- ✅ Test event displayed
- ✅ Status badge shows "Registration Open" (green)
- ✅ Entry cost shows "100 credits"

#### Test 3.2: View Event Details
1. Click on test event
2. View competitions list

**Expected Results:**
- ✅ 5 competitions listed (All Rounds, R1, R2, R3, R4)
- ✅ Each shows entry cost
- ✅ Each shows available slots
- ✅ "Build Your Team" button visible

#### Test 3.3: Build Team (Team Builder)
1. Click "Build Your Team" on "All Rounds" competition
2. Team builder loads

**Expected Results:**
- ✅ Golfers loaded from assigned group
- ✅ Salary display works
- ✅ Can select 6 golfers
- ✅ Can choose captain (2x points)
- ✅ Submit button enabled when team complete

**CRITICAL CHECK:**
If no golfers appear:
- Event MUST have golfer group assigned
- Golfer group MUST have members
- Run this to verify:
```sql
SELECT 
  c.name as comp_name,
  gg.name as group_name,
  COUNT(ggm.golfer_id) as golfer_count
FROM clubhouse_competitions c
LEFT JOIN golfer_groups gg ON gg.id = c.assigned_golfer_group_id
LEFT JOIN golfer_group_members ggm ON ggm.group_id = gg.id
WHERE c.event_id = (SELECT id FROM clubhouse_events WHERE name LIKE '%Test Championship%')
GROUP BY c.id, gg.id;
```

#### Test 3.4: Submit Entry
1. Complete team selection
2. Click "Submit Entry"

**Expected Results:**
- ✅ Credits deducted (1000 → 900)
- ✅ Entry created in `clubhouse_entries`
- ✅ Transaction recorded
- ✅ Redirect to confirmation page
- ✅ Can view entry in "My Entries"

**What to Check:**
```sql
-- Check entry created
SELECT 
  e.id,
  e.user_id,
  e.credits_paid,
  e.status,
  array_length(e.golfer_ids, 1) as golfer_count,
  e.captain_id
FROM clubhouse_entries e
WHERE e.user_id = 'your-user-id'
ORDER BY e.created_at DESC
LIMIT 1;

-- Should show:
-- - credits_paid = 100
-- - status = 'active'
-- - golfer_count = 6
-- - captain_id is one of the golfer_ids

-- Check credits deducted
SELECT credits FROM clubhouse_wallets WHERE user_id = 'your-user-id';
-- Should show 900

-- Check transaction
SELECT * FROM clubhouse_credit_transactions
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;
-- Should show amount = -100, reason includes 'Entry'
```

#### Test 3.5: Duplicate Entry Prevention
1. Try to submit another entry for SAME competition

**Expected Results:**
- ❌ Error: "Already entered this competition"
- ✅ No credits deducted
- ✅ No duplicate entry created

---

### Phase 4: Edge Cases & Error Handling

#### Test 4.1: Insufficient Credits
1. Use user with only 50 credits
2. Try to enter 100-credit competition

**Expected Results:**
- ❌ Error: "Insufficient credits"
- ✅ No entry created
- ✅ Balance unchanged

#### Test 4.2: Registration Closed
1. Edit event: Set registration_closes_at to 1 hour ago
2. Try to submit entry

**Expected Results:**
- ❌ Error: "Registration closed"
- ✅ "Build Your Team" button disabled or hidden

#### Test 4.3: Event Capacity Reached
1. Edit competition: Set max_entries = 1
2. Submit entry as User A (fills capacity)
3. Try to submit as User B

**Expected Results:**
- ❌ Error: "Competition full"
- ✅ User B cannot enter

---

### Phase 5: Database Trigger Validation

#### Test 5.1: Timing Sync Trigger
1. Edit event: Change registration_closes_at
2. Check if competitions auto-update

**Verify:**
```sql
-- Check event
SELECT registration_opens_at, registration_closes_at
FROM clubhouse_events
WHERE name LIKE '%Test Championship%';

-- Check competitions (should match event)
SELECT name, opens_at, closes_at
FROM clubhouse_competitions
WHERE event_id = (SELECT id FROM clubhouse_events WHERE name LIKE '%Test Championship%');

-- All competitions should have same opens_at/closes_at as event
```

**Expected:**
- ✅ ALL competitions updated automatically
- ✅ No manual sync needed

#### Test 5.2: Status Auto-Update Trigger
1. Create event with future dates
2. Check status = 'upcoming'
3. Edit to set start_date to past
4. Check status changes to 'active'

**Expected:**
- ✅ Status updates automatically when dates change
- ✅ No HTTP calls needed

---

### Phase 6: Comparison with InPlay System

**Goal:** Document improvements over current system

#### Comparison Checklist

| Feature | InPlay | Clubhouse | Better? |
|---------|--------|-----------|---------|
| Status calculation | Frontend calculates | Database trigger | ✅ |
| Timing sync | HTTP fetch (can fail) | Database trigger | ✅ |
| Status values | Mixed formats | 4 simple values | ✅ |
| Credits vs Pennies | Penny conversions | Whole numbers | ✅ |
| Table isolation | Shared tables | Separate tables | ✅ |

**Document Findings:**
- What works better in Clubhouse?
- What issues are solved?
- Any new issues discovered?

---

## 🐛 Known Issues to Watch For

1. **No golfers in team builder:**
   - Verify golfer group assigned to competition
   - Check group has members
   
2. **Credits not deducting:**
   - Check `apply_clubhouse_credits()` RPC function exists
   - Verify transaction log shows deduction

3. **Competitions not auto-created:**
   - Check event creation API logic
   - Should create 5 competitions on event insert

4. **Status not updating:**
   - Verify database triggers deployed
   - Check trigger functions exist in Supabase

---

## 📊 Success Criteria

**Before considering Clubhouse validated:**

- [ ] Can create events with auto-competitions ✅
- [ ] Can edit events with auto-sync to competitions ✅
- [ ] Status auto-calculates correctly ✅
- [ ] Can grant credits to users ✅
- [ ] Users can view wallet balance ✅
- [ ] Users can browse events ✅
- [ ] Team builder loads golfers ✅
- [ ] Can submit entries with credit deduction ✅
- [ ] Duplicate entry prevention works ✅
- [ ] Insufficient credits handled ✅
- [ ] Registration closed enforcement works ✅
- [ ] Database triggers function correctly ✅
- [ ] **Tested with 2-3 real events** ⏸️ (Not yet)
- [ ] **Validated bulletproof** ⏸️ (Not yet)

**After validation:**
- [ ] Document all findings
- [ ] Update SYSTEMATIC-FIX-PLAN.md with results
- [ ] Plan backport to InPlay

---

## 🚀 Quick Start Testing

**Run these commands to start testing:**

```powershell
# 1. Verify schema (already done)
node check-clubhouse-schema.js

# 2. Start dev server (if not running)
pnpm dev:golf

# 3. Open admin interface
# http://localhost:3003/clubhouse/admin/events

# 4. Open user interface  
# http://localhost:3003/clubhouse/events

# 5. Monitor API calls in terminal
# Watch for errors in dev server output
```

---

## 📝 Testing Checklist (Print This)

**Admin Flow:**
- [ ] Create event
- [ ] Edit event
- [ ] Verify 5 competitions auto-created
- [ ] Verify golfer group syncs to all competitions
- [ ] Grant credits to test user
- [ ] View entries list

**User Flow:**
- [ ] View events list
- [ ] View event details
- [ ] Check wallet balance shows credits
- [ ] Open team builder
- [ ] Verify golfers load
- [ ] Select 6 golfers + captain
- [ ] Submit entry
- [ ] Verify credits deducted
- [ ] View entry in "My Entries"

**Edge Cases:**
- [ ] Try duplicate entry (should fail)
- [ ] Try with insufficient credits (should fail)
- [ ] Try after registration closes (should fail)
- [ ] Fill competition to capacity (should block others)

**Database Verification:**
- [ ] Status auto-calculates
- [ ] Timing auto-syncs
- [ ] Credits transactions logged
- [ ] Entries recorded correctly

---

## 🎓 Next Steps After Testing

**If tests pass:**
1. Test 2-3 more events with different scenarios
2. Document all improvements
3. Create backport plan for InPlay
4. Update status value system across platform
5. Migrate timing triggers to InPlay

**If tests fail:**
1. Document specific failures
2. Check database trigger deployment
3. Verify RPC functions exist
4. Review API route logic
5. Fix issues in Clubhouse first
6. Re-test before backporting

---

**Remember:** Clubhouse is the proving ground. Fix everything here first, then apply to InPlay. This prevents breaking the production system!

**Start here:** http://localhost:3003/clubhouse/admin/events

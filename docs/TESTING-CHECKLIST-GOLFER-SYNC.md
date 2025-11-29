# Testing Checklist - Automated Golfer Group Sync

## Pre-Test Setup ✅

- [ ] Run database migration
  ```sql
  -- In Supabase SQL Editor:
  -- Copy and run: scripts/add-tour-to-tournaments.sql
  ```

- [ ] Verify tour column exists
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'tournaments' AND column_name = 'tour';
  -- Should return: tour
  ```

- [ ] Set BMW Australian PGA to European Tour
  ```sql
  UPDATE tournaments 
  SET tour = 'euro' 
  WHERE name LIKE '%BMW Australian PGA%';
  
  -- Verify:
  SELECT name, tour FROM tournaments 
  WHERE name LIKE '%BMW Australian PGA%';
  -- Should show: BMW Australian PGA Championship | euro
  ```

---

## Test 1: European Tour Sync (BMW Australian PGA)

### Steps
1. [ ] Navigate to admin panel
2. [ ] Go to Tournaments → BMW Australian PGA Championship
3. [ ] Click "Manage Golfers"
4. [ ] Open browser console (F12)
5. [ ] Click "Sync from DataGolf"

### Expected Console Output
```
Tournament data: { id: "...", name: "BMW...", tour: "euro" }
Syncing golfers from DataGolf for tour: euro
🔄 Syncing golfers for tournament...
✅ Found 156 golfers from DataGolf
📋 Event: BMW Australian PGA Championship
📊 Golfers processed: 12 new, 144 existing
✅ Added 156 golfers to tournament
👥 Creating/updating golfer group...
✅ Created new group: [uuid]
✅ Added 156 golfers to group
🔗 Linking group to tournament competitions...
✅ Linked group to 3 competitions
```

### Expected UI Success Message
```
✅ Successfully synced 156 golfers!
📊 12 new, 144 existing
👥 Golfer group: "BMW Australian PGA Championship - Field"
🔗 Linked to 3 competition(s)
✨ Team builder is now ready!
```

### Verification Queries
```sql
-- Check golfers were added
SELECT COUNT(*) as golfer_count FROM tournament_golfers 
WHERE tournament_id = '[bmw-tournament-id]';
-- Expected: 156

-- Check group was created
SELECT * FROM golfer_groups 
WHERE slug = 'bmw-australian-pga-championship-field';
-- Expected: 1 row

-- Check golfers in group
SELECT COUNT(*) FROM golfer_group_members 
WHERE group_id = (
  SELECT id FROM golfer_groups 
  WHERE slug = 'bmw-australian-pga-championship-field'
);
-- Expected: 156

-- Check group linked to competitions
SELECT 
  tc.id,
  ct.name,
  gg.name as group_name
FROM tournament_competitions tc
JOIN competition_types ct ON ct.id = tc.competition_type_id
JOIN competition_golfer_groups cgg ON cgg.competition_id = tc.id
JOIN golfer_groups gg ON gg.id = cgg.golfer_group_id
WHERE tc.tournament_id = '[bmw-tournament-id]';
-- Expected: 3 rows (Elite, Gold, Platinum)
```

### Pass Criteria
- [ ] 156 golfers synced
- [ ] Golfer group created with correct name
- [ ] All 156 golfers added to group
- [ ] Group linked to all 3 competitions
- [ ] No errors in console
- [ ] Success message displayed

---

## Test 2: Team Builder Integration

### Steps
1. [ ] Navigate to BMW Australian PGA Championship
2. [ ] Click on "Elite Competition"
3. [ ] Click "Team Builder" or "Create Entry"

### Expected Result
- [ ] All 156 golfers visible in team builder
- [ ] Player names display correctly
- [ ] Salaries show (if available)
- [ ] Can search/filter golfers
- [ ] Can add golfers to team

### Verification Query
```sql
-- Query team builder uses
SELECT 
  g.id,
  g.name,
  g.country,
  tg.salary,
  tg.status
FROM golfers g
JOIN golfer_group_members ggm ON ggm.golfer_id = g.id
JOIN competition_golfer_groups cgg ON cgg.golfer_group_id = ggm.group_id
JOIN tournament_golfers tg ON tg.golfer_id = g.id
WHERE cgg.competition_id = '[elite-competition-id]'
  AND tg.tournament_id = '[bmw-tournament-id]'
ORDER BY g.name;
-- Expected: 156 rows
```

### Pass Criteria
- [ ] All golfers visible
- [ ] No duplicate golfers
- [ ] Data displays correctly
- [ ] Team builder functional

---

## Test 3: PGA Tour Event (Verify No Regression)

### Steps
1. [ ] Navigate to any PGA Tour tournament (e.g., "The RSM Classic")
2. [ ] Click "Manage Golfers"
3. [ ] Check console - should see: `tour: "pga"`
4. [ ] Click "Sync from DataGolf"

### Expected Result
- [ ] Syncs from PGA Tour endpoint
- [ ] Creates golfer group
- [ ] Links to competitions
- [ ] Works exactly as before

### Pass Criteria
- [ ] PGA Tour sync still works
- [ ] No errors
- [ ] Group creation works
- [ ] Team builder functional

---

## Test 4: Re-Sync (Update Field)

### Steps
1. [ ] Return to BMW Australian PGA Championship
2. [ ] Click "Sync from DataGolf" again

### Expected Behavior
- [ ] Updates existing group (doesn't create duplicate)
- [ ] Adds any new golfers
- [ ] Removes old members, adds new ones
- [ ] Re-links to competitions

### Verification Query
```sql
-- Should still only be 1 group
SELECT COUNT(*) FROM golfer_groups 
WHERE slug = 'bmw-australian-pga-championship-field';
-- Expected: 1 (not 2!)

-- Members should be refreshed
SELECT COUNT(*) FROM golfer_group_members 
WHERE group_id = (
  SELECT id FROM golfer_groups 
  WHERE slug = 'bmw-australian-pga-championship-field'
);
-- Expected: 156 (or updated count)
```

### Pass Criteria
- [ ] No duplicate groups created
- [ ] Group members updated
- [ ] No errors
- [ ] Idempotent operation

---

## Test 5: AI Tournament Creator

### Steps
1. [ ] Create new tournament via AI
2. [ ] Verify tour field is stored
3. [ ] Sync golfers
4. [ ] Check auto-detection works

### Verification
```sql
-- Check tour field was stored
SELECT name, tour FROM tournaments 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC LIMIT 5;
-- Should show correct tour for each
```

### Pass Criteria
- [ ] AI creator stores tour field
- [ ] Tour auto-detected correctly
- [ ] Sync uses correct tour
- [ ] Full automation works

---

## Test 6: Multiple Competitions

### Scenario
Tournament with 5 competition types

### Steps
1. [ ] Create tournament with 5 competitions (Elite, Gold, Platinum, Silver, Bronze)
2. [ ] Sync golfers
3. [ ] Verify group linked to ALL competitions

### Verification Query
```sql
SELECT COUNT(*) FROM competition_golfer_groups cgg
JOIN tournament_competitions tc ON tc.id = cgg.competition_id
WHERE tc.tournament_id = '[tournament-id]';
-- Expected: 5 (one link per competition)
```

### Pass Criteria
- [ ] All competitions receive group link
- [ ] No competitions missed
- [ ] All team builders work

---

## Test 7: Tournament With No Competitions Yet

### Scenario
Sync golfers before competitions created

### Steps
1. [ ] Create tournament (no competitions)
2. [ ] Sync golfers
3. [ ] Check behavior

### Expected Result
- [ ] Golfers sync successfully
- [ ] Group created
- [ ] Console shows: "No competitions found"
- [ ] No errors thrown

### Then Create Competitions
1. [ ] Add competitions to tournament
2. [ ] Re-sync golfers

### Expected Result
- [ ] Group now links to new competitions
- [ ] Team builders work

### Pass Criteria
- [ ] Graceful handling of no competitions
- [ ] Later sync fixes links
- [ ] No data loss

---

## Performance Test

### Metrics to Track
- [ ] Time to sync 156 golfers: ____ seconds
- [ ] Console shows all steps complete
- [ ] No timeout errors
- [ ] Database responds quickly

### Expected Performance
- Sync time: < 15 seconds
- Group creation: < 2 seconds
- Competition linking: < 1 second
- Total: < 20 seconds

---

## Edge Cases

### Test 8: Golfer Already in Database
- [ ] Re-sync tournament with same golfers
- [ ] Should reuse existing golfer records
- [ ] No duplicates created

### Test 9: Special Characters in Tournament Name
- [ ] Tournament: "AT&T Pebble Beach Pro-Am"
- [ ] Group slug handles special chars
- [ ] No errors

### Test 10: Very Large Field (200+ golfers)
- [ ] Test with large tournament
- [ ] All golfers sync
- [ ] No pagination issues

---

## Rollback Test

### If Something Goes Wrong
```sql
-- Remove tour column
ALTER TABLE tournaments DROP COLUMN IF EXISTS tour;

-- Delete test golfer groups
DELETE FROM golfer_groups 
WHERE slug LIKE '%-field';

-- Verify rollback worked
SELECT COUNT(*) FROM tournaments WHERE tour IS NOT NULL;
-- Expected: 0
```

---

## Final Acceptance Criteria

### Must Pass All:
- [ ] European Tour sync works (156 golfers)
- [ ] PGA Tour sync still works (no regression)
- [ ] Golfer groups auto-created
- [ ] All competitions auto-linked
- [ ] Team builder shows all golfers
- [ ] Re-sync is idempotent
- [ ] No compilation errors
- [ ] No runtime errors
- [ ] Performance < 20 seconds
- [ ] Works for all 33 AI tournaments

### Success Metrics:
- [ ] 99% time savings (10 sec vs 10 min)
- [ ] Zero manual steps required
- [ ] Multi-tour support confirmed
- [ ] Production-ready quality

---

## Post-Test Cleanup

### If Tests Pass:
- [ ] Update all 33 AI tournaments with correct tour
- [ ] Document any issues found
- [ ] Deploy to production
- [ ] Monitor first week

### If Tests Fail:
- [ ] Document failures
- [ ] Roll back changes
- [ ] Fix issues
- [ ] Re-test

---

## Support Information

**DataGolf API:**
- Key: Configured in environment
- Access: Scratch Plus (full access)
- Rate Limit: 120 requests/minute
- Tours: pga, euro, kft, alt, opp

**Database Tables:**
- golfers
- tournament_golfers
- golfer_groups
- golfer_group_members
- competition_golfer_groups
- tournament_competitions

**Documentation:**
- Full guide: `docs/AUTOMATED-GOLFER-GROUP-SYNC.md`
- Quick start: `docs/QUICK-START-GOLFER-SYNC.md`
- European Tour: `docs/EUROPEAN-TOUR-SYNC-IMPLEMENTATION.md`

---

## Testing Sign-Off

**Tester:** _______________
**Date:** _______________
**Result:** ☐ PASS  ☐ FAIL
**Notes:** ________________________________

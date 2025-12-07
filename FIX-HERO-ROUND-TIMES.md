# Fix Hero World Challenge Round Times Issue

## Problem
The Hero World Challenge tournament has:
- Round 4 tee time reset to `00:00:00` (midnight)
- This causes Final Strike registration to close incorrectly
- ONE 2 ONE Round 4 templates also affected

## Root Cause
Tournament round times were likely reset when editing tournament settings. The tee time fields defaulted to `00:00` instead of preserving the original times.

## Solution

### Option 1: Fix via Admin Panel (RECOMMENDED)
1. Go to Admin → Tournaments
2. Find "Hero World Challenge"
3. Click "Edit Tournament"
4. Update Round 4 tee time to correct value (e.g., `12:00 PM EST`)
5. Save changes
6. The system will automatically recalculate registration close times

### Option 2: Fix via SQL (If admin panel doesn't work)
Run the SQL script in Supabase SQL Editor:

```bash
# File location
scripts/fix-hero-world-challenge-round-times.sql
```

This script will:
1. Reset Round 4 start time to `2025-12-07T17:00:00+00:00` (12:00 PM EST)
2. Update Final Strike reg_close_at to 15 minutes before Round 4
3. Update ONE 2 ONE Round 4 instances
4. Verify all changes

### Option 3: Check All Tournaments for This Issue

```bash
cd c:\inplaytv
node scripts/check-and-fix-round-times.js
```

This will scan all active tournaments and report any with `00:00` tee times.

## Prevention

To prevent this in the future, the admin panel tournament editor should:

1. **Preserve existing times** when editing tournaments
2. **Show warning** if tee time is set to midnight
3. **Validate** that round times are realistic (not 00:00)
4. **Auto-calculate** registration close times after saving

## Verification

After fixing, verify:

```sql
-- Check tournament round times
SELECT name, slug, round_4_start 
FROM tournaments 
WHERE slug = 'hero-world-challenge';

-- Check Final Strike status
SELECT 
  ct.name, 
  tc.reg_close_at, 
  tc.status,
  CASE 
    WHEN tc.reg_close_at > NOW() THEN 'OPEN'
    ELSE 'CLOSED'
  END as current_status
FROM tournament_competitions tc
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.tournament_id = (SELECT id FROM tournaments WHERE slug = 'hero-world-challenge')
  AND ct.slug = 'final-strike';
```

Expected result:
- Round 4 start should be during tournament hours (not midnight)
- Final Strike reg_close_at should be 15 minutes before Round 4 start
- Status should be 'OPEN' if current time is before reg_close_at

## Related Files
- `scripts/fix-hero-world-challenge-round-times.sql` - SQL fix
- `scripts/check-and-fix-round-times.js` - Detection script
- `scripts/fix-all-competition-reg-times.sql` - General reg time fixes

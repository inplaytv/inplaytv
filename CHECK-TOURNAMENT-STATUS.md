# Tournament Status Investigation

## Check Current Tournament Statuses

Run this in Supabase SQL Editor:

```sql
-- See what statuses are actually in the database
SELECT 
  status,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as tournament_names
FROM tournaments 
GROUP BY status
ORDER BY count DESC;

-- See tournaments with their key dates
SELECT 
  name,
  status,
  is_visible,
  registration_start,
  registration_end,
  start_date,
  end_date,
  CASE
    WHEN registration_start > NOW() THEN 'Before registration'
    WHEN registration_start <= NOW() AND registration_end > NOW() THEN 'Registration open'
    WHEN registration_end <= NOW() AND start_date > NOW() THEN 'Registration closed'
    WHEN start_date <= NOW() AND end_date > NOW() THEN 'Should be live'
    WHEN end_date <= NOW() THEN 'Should be completed'
  END as expected_status
FROM tournaments
WHERE is_visible = true
ORDER BY start_date;
```

## The Problem

**Two Systems:**
1. **Admin → All Tournaments** - Manual management
2. **Admin → Lifecycle Manager** - Automated status updates

**Status Values Used:**
- `upcoming` - Before registration opens
- `registration_open` - Registration is open  
- `registration_closed` - Registration closed, waiting for start
- `live` - Tournament in progress
- `completed` - Tournament finished

**The auto-update function** (`auto_update_tournament_statuses`) runs periodically and updates statuses based on dates.

## Recommended Fix

1. **Run the SQL above** to see actual statuses
2. **If tournaments have wrong status**, manually fix them:

```sql
-- Fix any tournaments that should be visible
UPDATE tournaments 
SET 
  status = CASE
    WHEN registration_start > NOW() THEN 'upcoming'
    WHEN registration_start <= NOW() AND registration_end > NOW() THEN 'registration_open'
    WHEN registration_end <= NOW() AND start_date > NOW() THEN 'registration_closed'
    WHEN start_date <= NOW() AND end_date > NOW() THEN 'live'
    ELSE 'completed'
  END
WHERE is_visible = true;
```

3. **Verify the cron job is running**:

```sql
SELECT * FROM cron.job WHERE jobname LIKE '%tournament%';
```

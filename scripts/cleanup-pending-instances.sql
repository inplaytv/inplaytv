-- ============================================
-- CLEANUP: Delete Abandoned Pending Instances
-- ============================================
-- This removes ONE 2 ONE instances that are stuck in 'pending' status
-- (user started creating a challenge but never completed team builder)
--
-- SAFE TO RUN: Only deletes instances with:
-- - status = 'pending' (never activated)
-- - No entries (user never submitted team)
-- - Older than 30 minutes
--
-- Run this manually or it will be cleaned automatically by the cron job
-- ============================================

-- Check what will be deleted (DRY RUN)
SELECT 
    id,
    instance_number,
    status,
    current_players,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM competition_instances
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '30 minutes'
  AND NOT EXISTS (
    SELECT 1 FROM competition_entries 
    WHERE competition_entries.competition_id = competition_instances.id
  )
ORDER BY created_at DESC;

-- Uncomment to actually delete:
/*
DELETE FROM competition_instances
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '30 minutes'
  AND NOT EXISTS (
    SELECT 1 FROM competition_entries 
    WHERE competition_entries.competition_id = competition_instances.id
  );
*/

-- Verify cleanup
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM competition_instances
GROUP BY status
ORDER BY status;

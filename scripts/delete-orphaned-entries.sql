-- ===================================================================
-- Delete Orphaned Competition Entries
-- This removes entries where the competition or instance no longer exists
-- ===================================================================

-- First, show what will be deleted
SELECT 
  'Orphaned ONE 2 ONE Entries' as entry_type,
  ce.id as entry_id,
  ce.entry_name,
  ce.instance_id,
  ce.created_at
FROM competition_entries ce
WHERE ce.instance_id IS NOT NULL 
  AND ce.instance_id NOT IN (SELECT id FROM competition_instances)
ORDER BY ce.created_at DESC;

SELECT 
  'Orphaned Regular Competition Entries' as entry_type,
  ce.id as entry_id,
  ce.entry_name,
  ce.competition_id,
  ce.created_at
FROM competition_entries ce
WHERE ce.competition_id IS NOT NULL 
  AND ce.competition_id NOT IN (SELECT id FROM tournament_competitions)
ORDER BY ce.created_at DESC;

-- Count what will be deleted
SELECT 
  'Summary' as info,
  COUNT(*) FILTER (WHERE instance_id IS NOT NULL AND instance_id NOT IN (SELECT id FROM competition_instances)) as orphaned_one2one,
  COUNT(*) FILTER (WHERE competition_id IS NOT NULL AND competition_id NOT IN (SELECT id FROM tournament_competitions)) as orphaned_regular,
  COUNT(*) FILTER (WHERE instance_id IS NOT NULL AND instance_id NOT IN (SELECT id FROM competition_instances)) + 
  COUNT(*) FILTER (WHERE competition_id IS NOT NULL AND competition_id NOT IN (SELECT id FROM tournament_competitions)) as total_to_delete
FROM competition_entries;

-- Delete orphaned ONE 2 ONE entries
DELETE FROM competition_entries 
WHERE instance_id IS NOT NULL 
  AND instance_id NOT IN (SELECT id FROM competition_instances);

-- Delete orphaned regular competition entries
DELETE FROM competition_entries 
WHERE competition_id IS NOT NULL 
  AND competition_id NOT IN (SELECT id FROM tournament_competitions);

-- Verify deletion
SELECT 
  'Remaining entries' as info,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE instance_id IS NOT NULL) as one2one_entries,
  COUNT(*) FILTER (WHERE competition_id IS NOT NULL) as regular_entries
FROM competition_entries;

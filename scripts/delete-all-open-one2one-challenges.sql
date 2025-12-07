-- ===================================================================
-- DELETE All Open ONE 2 ONE Challenges and Their Entries
-- This will clean up all test data
-- ===================================================================

-- First, show what will be deleted
SELECT 
  'Instances to delete' as info,
  ci.id as instance_id,
  ci.instance_number,
  t.name as tournament_name,
  ci.current_players,
  ci.created_at
FROM competition_instances ci
JOIN tournaments t ON t.id = ci.tournament_id
WHERE ci.status = 'open'
  AND ci.current_players < 2
ORDER BY ci.created_at DESC;

-- Show entries that will be deleted
SELECT 
  'Entries to delete' as info,
  ce.id as entry_id,
  ce.instance_id,
  ce.user_id,
  ce.entry_name,
  ce.created_at
FROM competition_entries ce
WHERE ce.instance_id IN (
  SELECT id FROM competition_instances 
  WHERE status = 'open' AND current_players < 2
)
ORDER BY ce.created_at DESC;

-- Delete the entries first (foreign key constraint)
DELETE FROM competition_entries 
WHERE instance_id IN (
  SELECT id FROM competition_instances 
  WHERE status = 'open' AND current_players < 2
);

-- Delete the instances
DELETE FROM competition_instances 
WHERE status = 'open' AND current_players < 2;

-- Verify deletion
SELECT 
  'Remaining open challenges' as info,
  COUNT(*) as count
FROM competition_instances 
WHERE status = 'open' AND current_players < 2;

SELECT 
  'Total ONE 2 ONE instances' as info,
  COUNT(*) as count
FROM competition_instances;

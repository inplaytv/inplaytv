-- ===================================================================
-- DELETE ALL ONE 2 ONE Test Entries for Fresh Start
-- This removes ALL ONE 2 ONE entries and instances regardless of status
-- ===================================================================

-- First, show what will be deleted
SELECT 
  'Entries to delete' as info,
  ce.id as entry_id,
  ce.entry_name,
  ci.status,
  ci.instance_number,
  t.name as tournament_name,
  ct.name as template_name
FROM competition_entries ce
JOIN competition_instances ci ON ci.id = ce.instance_id
JOIN tournaments t ON t.id = ci.tournament_id
JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Count summary
SELECT 
  'Summary' as info,
  COUNT(DISTINCT ce.id) as total_entries,
  COUNT(DISTINCT ci.id) as total_instances
FROM competition_entries ce
JOIN competition_instances ci ON ci.id = ce.instance_id
WHERE ce.instance_id IS NOT NULL;

-- Delete all ONE 2 ONE entries first (foreign key constraint)
DELETE FROM competition_entries 
WHERE instance_id IS NOT NULL;

-- Delete all ONE 2 ONE instances
DELETE FROM competition_instances;

-- Verify deletion
SELECT 
  'Verification' as info,
  COUNT(*) as remaining_entries
FROM competition_entries 
WHERE instance_id IS NOT NULL;

SELECT 
  'Verification' as info,
  COUNT(*) as remaining_instances
FROM competition_instances;

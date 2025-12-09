-- Complete cleanup - delete EVERYTHING and start fresh

-- Delete ALL competition entries
DELETE FROM competition_entries WHERE instance_id IS NOT NULL;

-- Delete ALL competition instances  
DELETE FROM competition_instances;

-- Verify clean slate
SELECT 
  (SELECT COUNT(*) FROM competition_instances) as instances,
  (SELECT COUNT(*) FROM competition_entries WHERE instance_id IS NOT NULL) as entries;

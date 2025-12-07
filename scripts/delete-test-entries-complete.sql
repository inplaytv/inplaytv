-- Complete cleanup for those 2 specific test entries
-- This removes ALL related data

-- Delete entry picks first
DELETE FROM entry_picks 
WHERE entry_id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

-- Delete competition results
DELETE FROM competition_results 
WHERE winner_entry_id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

-- Delete the entries themselves
DELETE FROM competition_entries 
WHERE id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

-- Verify they're gone
SELECT COUNT(*) as remaining_entries
FROM competition_entries 
WHERE id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

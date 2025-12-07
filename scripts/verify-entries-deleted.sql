-- Verify if those entries still exist
SELECT 
  ce.id as entry_id,
  ce.entry_name,
  ce.created_at,
  'Entry still exists' as status
FROM competition_entries ce
WHERE ce.id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

-- Check if there are entry_picks
SELECT 
  ep.entry_id,
  ep.golfer_id,
  'Entry pick still exists' as status
FROM entry_picks ep
WHERE ep.entry_id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

-- Check competition_results
SELECT 
  cr.id as result_id,
  cr.winner_entry_id,
  'Competition result still exists' as status
FROM competition_results cr
WHERE cr.winner_entry_id IN (
  'd5650117-0002-4add-af75-263b79f43fa4',
  '47bdc884-2d87-4630-a647-2181543ed959'
);

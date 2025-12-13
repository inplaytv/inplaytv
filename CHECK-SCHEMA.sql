-- Check tournament_golfers table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournament_golfers'
ORDER BY ordinal_position;

-- Check if there's a linking table between golfer_groups and tournament_golfers
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%golfer%group%';

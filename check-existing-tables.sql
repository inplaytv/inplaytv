-- Check what competition-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%compet%'
ORDER BY table_name;

-- Check what instance-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%instance%'
ORDER BY table_name;

-- Check if there are any ONE 2 ONE records already in tournament_competitions
SELECT 
  COUNT(*) as one2one_count,
  status
FROM tournament_competitions
WHERE competition_format = 'one2one'
GROUP BY status;

-- Check competition_entries for any with instance_id
SELECT COUNT(*) as entries_with_instance_id
FROM competition_entries
WHERE instance_id IS NOT NULL;

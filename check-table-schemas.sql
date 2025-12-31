-- Check the actual schema of tournament_competitions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournament_competitions'
ORDER BY ordinal_position;

-- Check the actual schema of competition_instances
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'competition_instances'
ORDER BY ordinal_position;

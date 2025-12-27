-- Check competition record and all its fields
SELECT *
FROM tournament_competitions
WHERE id = '686e42b9-e2b5-42c3-90d6-fabae22b2e37';

-- Check what columns exist on competition_templates
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'competition_templates'
ORDER BY column_name;

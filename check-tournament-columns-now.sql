-- Check what columns actually exist in tournaments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
AND column_name LIKE '%round%' OR column_name LIKE '%tee%' OR column_name LIKE '%time%'
ORDER BY column_name;

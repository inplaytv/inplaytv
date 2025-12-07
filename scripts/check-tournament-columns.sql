-- Check what columns actually exist in the tournaments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
ORDER BY ordinal_position;

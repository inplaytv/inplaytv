-- Show ALL columns in tournaments table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
ORDER BY ordinal_position;

-- Show ALL columns in competition_types table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'competition_types' 
ORDER BY ordinal_position;

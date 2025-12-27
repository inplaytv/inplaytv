-- Check what picks table actually exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%pick%'
ORDER BY table_name;

-- Check the actual structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE '%pick%'
ORDER BY table_name, ordinal_position;

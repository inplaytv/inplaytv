-- Just get the table name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%pick%'
ORDER BY table_name;

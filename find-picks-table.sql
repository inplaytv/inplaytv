-- Find the correct table name for entry picks

-- List all tables with 'entry' or 'pick' in the name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name LIKE '%entry%' OR table_name LIKE '%pick%' OR table_name LIKE '%golfer%')
ORDER BY table_name;

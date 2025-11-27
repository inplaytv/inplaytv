-- Remove apostrophes and quotes from golfer names
-- Run this in Supabase SQL Editor

BEGIN;

-- Remove quotes and apostrophes from first names
UPDATE golfers 
SET first_name = REPLACE(REPLACE(REPLACE(first_name, '"', ''), '''', ''), '`', '')
WHERE first_name LIKE '%"%' 
   OR first_name LIKE '%''%' 
   OR first_name LIKE '%`%';

-- Remove quotes and apostrophes from last names
UPDATE golfers 
SET last_name = REPLACE(REPLACE(REPLACE(last_name, '"', ''), '''', ''), '`', '')
WHERE last_name LIKE '%"%' 
   OR last_name LIKE '%''%' 
   OR last_name LIKE '%`%';

COMMIT;

-- Verify it worked (full_name is auto-generated from first_name + last_name)
SELECT 
  first_name,
  last_name,
  full_name,
  world_rank
FROM golfers
ORDER BY world_rank
LIMIT 20;

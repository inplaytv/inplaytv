-- COMPREHENSIVE GOLFER CLEANUP AND RANKING UPDATE
-- This fixes ALL issues: numbers in names, full names in first_name, adds rankings
-- Run this ONCE in Supabase SQL Editor

BEGIN;

-- STEP 1: Clean up golfers with numbers at end of last name (e.g., "Scheffler 1")
-- Extract the number and remove it from the name
UPDATE golfers 
SET 
  last_name = REGEXP_REPLACE(last_name, '\s+\d+$', ''),
  world_rank = CASE 
    WHEN last_name ~ '\s+\d+$' THEN 
      CAST(REGEXP_REPLACE(last_name, '^.*\s+(\d+)$', '\1') AS INTEGER)
    ELSE world_rank
  END
WHERE last_name ~ '\s+\d+$';

-- STEP 2: Fix golfers with full names in first_name field (e.g., first_name = "Davis Thompson")
-- This handles cases where first_name has a space (full name) AND last_name has a number
UPDATE golfers
SET 
  last_name = CASE 
    WHEN first_name LIKE '% %' THEN 
      SPLIT_PART(first_name, ' ', 2)
    ELSE last_name
  END,
  first_name = CASE 
    WHEN first_name LIKE '% %' THEN 
      SPLIT_PART(first_name, ' ', 1)
    ELSE first_name
  END
WHERE first_name LIKE '% %';

-- STEP 3: Remove any remaining apostrophes/quotes
UPDATE golfers 
SET first_name = REPLACE(REPLACE(REPLACE(first_name, '"', ''), '''', ''), '`', '')
WHERE first_name LIKE '%"%' OR first_name LIKE '%''%' OR first_name LIKE '%`%';

UPDATE golfers 
SET last_name = REPLACE(REPLACE(REPLACE(last_name, '"', ''), '''', ''), '`', '')
WHERE last_name LIKE '%"%' OR last_name LIKE '%''%' OR last_name LIKE '%`%';

-- STEP 4: Now set world rankings for top golfers
UPDATE golfers SET 
  world_rank = 1,
  skill_rating = 12.5,
  salary_pennies = 15000,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Scottie' AND last_name = 'Scheffler';

UPDATE golfers SET 
  world_rank = 2,
  skill_rating = 11.8,
  salary_pennies = 14910,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Rory' AND last_name = 'McIlroy';

UPDATE golfers SET 
  world_rank = 3,
  skill_rating = 11.2,
  salary_pennies = 14865,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Jon' AND last_name = 'Rahm';

UPDATE golfers SET 
  world_rank = 4,
  skill_rating = 10.9,
  salary_pennies = 14820,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Viktor' AND last_name = 'Hovland';

UPDATE golfers SET 
  world_rank = 5,
  skill_rating = 10.7,
  salary_pennies = 14775,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Xander' AND last_name = 'Schauffele';

UPDATE golfers SET 
  world_rank = 6,
  skill_rating = 10.5,
  salary_pennies = 14730,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Ludvig' AND last_name = 'Aberg';

UPDATE golfers SET 
  world_rank = 7,
  skill_rating = 10.3,
  salary_pennies = 14685,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Patrick' AND last_name = 'Cantlay';

UPDATE golfers SET 
  world_rank = 8,
  skill_rating = 10.1,
  salary_pennies = 14640,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Collin' AND last_name = 'Morikawa';

UPDATE golfers SET 
  world_rank = 9,
  skill_rating = 9.9,
  salary_pennies = 14595,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Wyndham' AND last_name = 'Clark';

UPDATE golfers SET 
  world_rank = 10,
  skill_rating = 9.7,
  salary_pennies = 14550,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE first_name = 'Tommy' AND last_name = 'Fleetwood';

COMMIT;

-- Verify everything worked
SELECT 
  first_name,
  last_name,
  full_name,
  world_rank,
  skill_rating,
  salary_pennies / 100.0 as salary_pounds
FROM golfers
WHERE world_rank IS NOT NULL
ORDER BY world_rank;

-- Check for any remaining issues
SELECT 'Still has numbers in last_name:' as issue, first_name, last_name
FROM golfers
WHERE last_name ~ '\d';

SELECT 'Still has full name in first_name:' as issue, first_name, last_name
FROM golfers
WHERE first_name LIKE '% %' AND last_name != '';

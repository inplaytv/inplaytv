-- Add world rankings to top golfers
-- Run this AFTER fix-all-golfer-issues.sql

BEGIN;

-- Set world rankings for top golfers (using cleaned names)
UPDATE golfers SET 
  world_rank = 1,
  skill_rating = 12.5,
  salary_pennies = 15000,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'scottie' AND LOWER(last_name) = 'scheffler';

UPDATE golfers SET 
  world_rank = 2,
  skill_rating = 11.8,
  salary_pennies = 14910,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'rory' AND LOWER(last_name) = 'mcilroy';

UPDATE golfers SET 
  world_rank = 3,
  skill_rating = 11.2,
  salary_pennies = 14865,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'jon' AND LOWER(last_name) = 'rahm';

UPDATE golfers SET 
  world_rank = 4,
  skill_rating = 10.9,
  salary_pennies = 14820,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'viktor' AND LOWER(last_name) = 'hovland';

UPDATE golfers SET 
  world_rank = 5,
  skill_rating = 10.7,
  salary_pennies = 14775,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'xander' AND LOWER(last_name) = 'schauffele';

UPDATE golfers SET 
  world_rank = 6,
  skill_rating = 10.5,
  salary_pennies = 14730,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'ludvig' AND LOWER(last_name) = 'aberg';

UPDATE golfers SET 
  world_rank = 7,
  skill_rating = 10.3,
  salary_pennies = 14685,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'patrick' AND LOWER(last_name) = 'cantlay';

UPDATE golfers SET 
  world_rank = 8,
  skill_rating = 10.1,
  salary_pennies = 14640,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'collin' AND LOWER(last_name) = 'morikawa';

UPDATE golfers SET 
  world_rank = 9,
  skill_rating = 9.9,
  salary_pennies = 14595,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'wyndham' AND LOWER(last_name) = 'clark';

UPDATE golfers SET 
  world_rank = 10,
  skill_rating = 9.7,
  salary_pennies = 14550,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE LOWER(first_name) = 'tommy' AND LOWER(last_name) = 'fleetwood';

COMMIT;

-- Check which golfers got updated
SELECT 
  first_name,
  last_name,
  full_name,
  world_rank,
  skill_rating
FROM golfers
WHERE world_rank IS NOT NULL
ORDER BY world_rank;

-- Check if these golfers exist but don't have rankings
SELECT 
  first_name,
  last_name,
  full_name,
  world_rank
FROM golfers
WHERE LOWER(last_name) IN ('scheffler', 'mcilroy', 'rahm', 'hovland', 'schauffele', 'aberg', 'cantlay', 'morikawa', 'clark', 'fleetwood')
ORDER BY last_name;

-- Direct golfer insertion with rankings
-- Copy this entire script into Supabase SQL Editor and click RUN

BEGIN;

-- UPDATE existing golfers with rankings (don't delete them)
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

COMMIT;

-- Verify it worked
SELECT 
  first_name,
  last_name,
  full_name,
  world_rank,
  skill_rating,
  salary_pennies / 100.0 as salary_pounds
FROM golfers
WHERE world_rank IS NOT NULL
ORDER BY world_rank
LIMIT 10;

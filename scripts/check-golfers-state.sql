-- Check current golfer state
SELECT 
  id,
  first_name,
  last_name,
  full_name,
  world_rank,
  skill_rating
FROM golfers
ORDER BY 
  CASE WHEN world_rank IS NOT NULL THEN 0 ELSE 1 END,
  world_rank NULLS LAST,
  last_name
LIMIT 30;

-- Check for golfers with numbers in last names
SELECT 'Has numbers in last name:' as issue, first_name, last_name, world_rank
FROM golfers
WHERE last_name ~ '\d'
ORDER BY last_name;

-- Check for golfers with full names in first_name
SELECT 'Full name in first_name:' as issue, first_name, last_name, world_rank
FROM golfers
WHERE first_name LIKE '% %'
ORDER BY first_name;

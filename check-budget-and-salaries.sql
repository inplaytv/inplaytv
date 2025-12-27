-- First, check what columns exist on tournament_competitions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournament_competitions' 
  AND column_name LIKE '%budget%'
ORDER BY column_name;

-- Check the competition details
SELECT 
  tc.id,
  ct.name as competition_name,
  tc.*
FROM tournament_competitions tc
LEFT JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE tc.id = '686e42b9-e2b5-42c3-90d6-fabae22b2e37';

-- Check golfer salary range for this competition
SELECT 
  MIN(g.salary_pennies) as min_salary_pennies,
  MAX(g.salary_pennies) as max_salary_pennies,
  AVG(g.salary_pennies) as avg_salary_pennies,
  MIN(g.salary_pennies) / 100.0 as min_pounds,
  MAX(g.salary_pennies) / 100.0 as max_pounds,
  AVG(g.salary_pennies) / 100.0 as avg_pounds
FROM golfers g
INNER JOIN golfer_group_members ggm ON g.id = ggm.golfer_id
WHERE ggm.group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86';

-- Show top 10 cheapest golfers
SELECT 
  g.full_name,
  g.salary_pennies / 100.0 as salary_pounds,
  g.world_ranking
FROM golfers g
INNER JOIN golfer_group_members ggm ON g.id = ggm.golfer_id
WHERE ggm.group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
ORDER BY g.salary_pennies ASC
LIMIT 10;

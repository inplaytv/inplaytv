-- Check golfer salaries for Mister G's Open Field
SELECT 
  g.id,
  g.full_name,
  g.salary_pennies,
  g.salary_pennies / 100.0 as salary_pounds,
  CASE 
    WHEN g.salary_pennies IS NULL OR g.salary_pennies = 0 THEN '❌ NO SALARY'
    ELSE '✅ HAS SALARY'
  END as status
FROM golfers g
INNER JOIN golfer_group_members ggm ON g.id = ggm.golfer_id
WHERE ggm.group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
ORDER BY g.salary_pennies DESC NULLS LAST
LIMIT 20;

-- Count golfers without salaries
SELECT 
  COUNT(*) as total_golfers,
  COUNT(CASE WHEN salary_pennies IS NULL OR salary_pennies = 0 THEN 1 END) as without_salary,
  COUNT(CASE WHEN salary_pennies > 0 THEN 1 END) as with_salary
FROM golfers g
INNER JOIN golfer_group_members ggm ON g.id = ggm.golfer_id
WHERE ggm.group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86';

-- If they don't have salaries, set default values based on world ranking
-- UNCOMMENT AND RUN THIS IF ALL SALARIES ARE 0:
/*
UPDATE golfers g
SET salary_pennies = CASE
  WHEN g.world_ranking IS NULL THEN 500000  -- £5,000 for unranked
  WHEN g.world_ranking <= 10 THEN 1200000   -- £12,000 for top 10
  WHEN g.world_ranking <= 50 THEN 1000000   -- £10,000 for top 50
  WHEN g.world_ranking <= 100 THEN 800000   -- £8,000 for top 100
  WHEN g.world_ranking <= 200 THEN 650000   -- £6,500 for top 200
  ELSE 500000                                -- £5,000 for others
END
WHERE g.id IN (
  SELECT golfer_id 
  FROM golfer_group_members 
  WHERE group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
)
AND (g.salary_pennies IS NULL OR g.salary_pennies = 0);
*/

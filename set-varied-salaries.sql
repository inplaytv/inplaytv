-- Set varied salaries for more realistic testing
-- This will give golfers different prices based on a random distribution

WITH golfer_list AS (
  SELECT 
    golfer_id,
    ROW_NUMBER() OVER (ORDER BY RANDOM()) as random_rank
  FROM golfer_group_members
  WHERE group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
)
UPDATE golfers g
SET salary_pennies = CASE
  WHEN gl.random_rank <= 10 THEN 15000   -- £150 (top tier)
  WHEN gl.random_rank <= 30 THEN 12000   -- £120 (high tier)
  WHEN gl.random_rank <= 60 THEN 9000    -- £90 (mid tier)
  ELSE 6000                               -- £60 (value tier)
END
FROM golfer_list gl
WHERE g.id = gl.golfer_id;

-- Check the distribution
SELECT 
  CASE 
    WHEN salary_pennies = 15000 THEN 'Top (£150)'
    WHEN salary_pennies = 12000 THEN 'High (£120)'
    WHEN salary_pennies = 9000 THEN 'Mid (£90)'
    WHEN salary_pennies = 6000 THEN 'Value (£60)'
  END as tier,
  COUNT(*) as count
FROM golfers
WHERE id IN (
  SELECT golfer_id FROM golfer_group_members 
  WHERE group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
)
GROUP BY salary_pennies
ORDER BY salary_pennies DESC;

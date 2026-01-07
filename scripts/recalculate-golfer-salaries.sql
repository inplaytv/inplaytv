-- ============================================================================
-- GOLFER SALARY RECALCULATION FOR £60,000 CAP
-- ============================================================================
-- PURPOSE: Scale golfer salaries from £100 range to £8,000-£15,000 range
-- 
-- STRATEGY: Use world_ranking to determine salary tier
-- - Top 10: £12,000 - £15,000 (1,200,000 - 1,500,000 pennies)
-- - Top 50: £9,000 - £11,999 (900,000 - 1,199,900 pennies)
-- - Top 100: £7,000 - £8,999 (700,000 - 899,900 pennies)
-- - Others: £5,000 - £6,999 (500,000 - 699,900 pennies)
--
-- This creates realistic team-building constraints where users must
-- balance 1-2 premium golfers with mid-tier and value picks
-- ============================================================================

-- BACKUP CURRENT SALARIES (just in case)
CREATE TEMP TABLE golfer_salary_backup AS
SELECT id, full_name, salary_pennies, world_ranking
FROM golfers;

-- RECALCULATE BASED ON WORLD RANKING
UPDATE golfers
SET salary_pennies = CASE
  -- Top 10: £12,000 - £15,000
  WHEN world_ranking <= 10 THEN 1200000 + (RANDOM() * 300000)::INTEGER
  
  -- Top 11-50: £9,000 - £11,999
  WHEN world_ranking <= 50 THEN 900000 + (RANDOM() * 299900)::INTEGER
  
  -- Top 51-100: £7,000 - £8,999
  WHEN world_ranking <= 100 THEN 700000 + (RANDOM() * 199900)::INTEGER
  
  -- Others (or no ranking): £5,000 - £6,999
  ELSE 500000 + (RANDOM() * 199900)::INTEGER
END
WHERE salary_pennies IS NOT NULL;

-- STANDARDIZE NULL SALARIES (golfers without rankings)
UPDATE golfers
SET salary_pennies = 500000 + (RANDOM() * 199900)::INTEGER
WHERE salary_pennies IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show salary distribution by tier
SELECT 
  CASE 
    WHEN salary_pennies >= 1200000 THEN 'Premium (£12k+)'
    WHEN salary_pennies >= 900000 THEN 'High-Value (£9k-12k)'
    WHEN salary_pennies >= 700000 THEN 'Mid-Tier (£7k-9k)'
    ELSE 'Value (£5k-7k)'
  END AS tier,
  COUNT(*) as golfers,
  MIN(salary_pennies) as min_salary,
  MAX(salary_pennies) as max_salary,
  AVG(salary_pennies)::INTEGER as avg_salary
FROM golfers
GROUP BY tier
ORDER BY MIN(salary_pennies) DESC;

-- Show top 20 most expensive golfers
SELECT 
  full_name,
  world_ranking,
  salary_pennies,
  (salary_pennies / 100) as salary_pounds
FROM golfers
ORDER BY salary_pennies DESC
LIMIT 20;

-- Verify team-building economics (can we build a team?)
WITH sample_team AS (
  SELECT SUM(salary_pennies) as total_cost
  FROM (
    SELECT salary_pennies FROM golfers ORDER BY salary_pennies DESC LIMIT 6
  ) expensive_team
)
SELECT 
  total_cost,
  (total_cost / 100) as total_pounds,
  6000000 as budget_pennies,
  60000 as budget_pounds,
  CASE 
    WHEN total_cost <= 6000000 THEN '✅ Can afford most expensive team'
    ELSE '❌ Most expensive team exceeds cap'
  END as validation
FROM sample_team;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
DECLARE
  v_avg_salary INTEGER;
  v_min_salary INTEGER;
  v_max_salary INTEGER;
BEGIN
  SELECT 
    AVG(salary_pennies)::INTEGER,
    MIN(salary_pennies),
    MAX(salary_pennies)
  INTO v_avg_salary, v_min_salary, v_max_salary
  FROM golfers;
  
  RAISE NOTICE '✅ GOLFER SALARIES RECALCULATED';
  RAISE NOTICE '📊 Min Salary: £% (%p)', v_min_salary/100, v_min_salary;
  RAISE NOTICE '📊 Max Salary: £% (%p)', v_max_salary/100, v_max_salary;
  RAISE NOTICE '📊 Avg Salary: £% (%p)', v_avg_salary/100, v_avg_salary;
  RAISE NOTICE '💰 Salary Cap: £60,000 (6,000,000p)';
  RAISE NOTICE '✅ Ready for DraftKings-style team building!';
END $$;

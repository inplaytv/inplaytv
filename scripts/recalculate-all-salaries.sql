-- ===================================================================
-- RECALCULATE ALL GOLFER SALARIES WITH NEW £60,000 SYSTEM
-- Run this in Supabase Dashboard SQL Editor
-- This updates all existing competition_golfers to use the new salary formula
-- ===================================================================

-- IMPORTANT: This is a temporary script to update existing data
-- For NEW competitions, the salary calculation happens automatically
-- via the admin panel when syncing golfer groups to competitions

-- Check current salaries before update
SELECT 
  'BEFORE UPDATE' as stage,
  COUNT(*) as total_golfers,
  MIN(salary) as min_salary,
  MAX(salary) as max_salary,
  ROUND(AVG(salary)) as avg_salary
FROM public.competition_golfers;

-- ===================================================================
-- MANUAL SALARY UPDATE BASED ON WORLD RANKING
-- Using the new OWGR-based formula
-- ===================================================================

-- Update salaries based on world ranking tiers
-- Rank #1-2: £12,000-£12,500
UPDATE public.competition_golfers cg
SET salary = 12500
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking = 1;

UPDATE public.competition_golfers cg
SET salary = 12000
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking = 2;

-- Rank #3-5: £11,500-£11,900
UPDATE public.competition_golfers cg
SET salary = CASE
  WHEN g.world_ranking = 3 THEN 11900
  WHEN g.world_ranking = 4 THEN 11700
  WHEN g.world_ranking = 5 THEN 11500
  ELSE 11500
END
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking BETWEEN 3 AND 5;

-- Rank #6-10: £10,600-£11,200
UPDATE public.competition_golfers cg
SET salary = CASE
  WHEN g.world_ranking = 6 THEN 11200
  WHEN g.world_ranking = 7 THEN 11000
  WHEN g.world_ranking = 8 THEN 10900
  WHEN g.world_ranking = 9 THEN 10800
  WHEN g.world_ranking = 10 THEN 10600
  ELSE 10600
END
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking BETWEEN 6 AND 10;

-- Rank #11-25: £9,100-£10,500
UPDATE public.competition_golfers cg
SET salary = CASE
  WHEN g.world_ranking <= 15 THEN 10500
  WHEN g.world_ranking <= 20 THEN 9800
  ELSE 9100
END
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking BETWEEN 11 AND 25;

-- Rank #26-50: £7,600-£9,000
UPDATE public.competition_golfers cg
SET salary = CASE
  WHEN g.world_ranking <= 35 THEN 9000
  WHEN g.world_ranking <= 40 THEN 8500
  ELSE 7600
END
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking BETWEEN 26 AND 50;

-- Rank #51-100: £6,600-£7,500
UPDATE public.competition_golfers cg
SET salary = CASE
  WHEN g.world_ranking <= 70 THEN 7500
  WHEN g.world_ranking <= 85 THEN 7000
  ELSE 6600
END
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking BETWEEN 51 AND 100;

-- Rank #101-200: £5,600-£6,500
UPDATE public.competition_golfers cg
SET salary = CASE
  WHEN g.world_ranking <= 150 THEN 6500
  ELSE 5600
END
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking BETWEEN 101 AND 200;

-- Rank #201+: £5,000 (minimum)
UPDATE public.competition_golfers cg
SET salary = 5000
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND g.world_ranking > 200;

-- Golfers without ranking: £5,000 (minimum)
UPDATE public.competition_golfers cg
SET salary = 5000
FROM public.golfers g
WHERE cg.golfer_id = g.id 
  AND (g.world_ranking IS NULL OR g.world_ranking <= 0);

-- Check salaries after update
SELECT 
  'AFTER UPDATE' as stage,
  COUNT(*) as total_golfers,
  MIN(salary) as min_salary,
  MAX(salary) as max_salary,
  ROUND(AVG(salary)) as avg_salary
FROM public.competition_golfers;

-- Show salary distribution by ranking tiers
SELECT 
  CASE
    WHEN g.world_ranking = 1 THEN 'Rank #1'
    WHEN g.world_ranking BETWEEN 2 AND 5 THEN 'Rank #2-5'
    WHEN g.world_ranking BETWEEN 6 AND 10 THEN 'Rank #6-10'
    WHEN g.world_ranking BETWEEN 11 AND 25 THEN 'Rank #11-25'
    WHEN g.world_ranking BETWEEN 26 AND 50 THEN 'Rank #26-50'
    WHEN g.world_ranking BETWEEN 51 AND 100 THEN 'Rank #51-100'
    WHEN g.world_ranking BETWEEN 101 AND 200 THEN 'Rank #101-200'
    WHEN g.world_ranking > 200 THEN 'Rank #201+'
    ELSE 'No Ranking'
  END as ranking_tier,
  COUNT(*) as golfers_count,
  MIN(cg.salary) as min_salary,
  MAX(cg.salary) as max_salary,
  ROUND(AVG(cg.salary)) as avg_salary
FROM public.competition_golfers cg
JOIN public.golfers g ON cg.golfer_id = g.id
GROUP BY ranking_tier
ORDER BY 
  CASE
    WHEN g.world_ranking = 1 THEN 1
    WHEN g.world_ranking BETWEEN 2 AND 5 THEN 2
    WHEN g.world_ranking BETWEEN 6 AND 10 THEN 3
    WHEN g.world_ranking BETWEEN 11 AND 25 THEN 4
    WHEN g.world_ranking BETWEEN 26 AND 50 THEN 5
    WHEN g.world_ranking BETWEEN 51 AND 100 THEN 6
    WHEN g.world_ranking BETWEEN 101 AND 200 THEN 7
    WHEN g.world_ranking > 200 THEN 8
    ELSE 9
  END;

-- Success message
SELECT '✅ Salaries updated to new £60,000 system!' as message;
SELECT '📊 Check the salary distribution above to verify' as next_step;
SELECT '💡 For future competitions, use Admin Panel > Golfer Groups > Calculate Salaries' as note;

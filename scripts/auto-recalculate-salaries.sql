-- ===================================================================
-- AUTOMATED SALARY RECALCULATION - USING EXACT NEW FORMULA
-- Run this in Supabase Dashboard SQL Editor
-- This uses the exact same formula as the new salary calculator
-- ===================================================================

-- Create a temporary function to calculate OWGR factor
CREATE OR REPLACE FUNCTION calculate_owgr_factor(ranking INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  -- Direct lookups for key rankings
  IF ranking = 1 THEN RETURN 1.0;
  ELSIF ranking = 2 THEN RETURN 0.93;
  ELSIF ranking = 5 THEN RETURN 0.87;
  ELSIF ranking = 10 THEN RETURN 0.75;
  ELSIF ranking = 25 THEN RETURN 0.55;
  ELSIF ranking = 50 THEN RETURN 0.35;
  ELSIF ranking = 100 THEN RETURN 0.22;
  ELSIF ranking = 200 THEN RETURN 0.08;
  ELSIF ranking >= 300 THEN RETURN 0.0;
  
  -- Linear interpolation between known points
  ELSIF ranking BETWEEN 1 AND 2 THEN
    RETURN 1.0 + (0.93 - 1.0) * (ranking - 1.0) / (2 - 1);
  ELSIF ranking BETWEEN 2 AND 5 THEN
    RETURN 0.93 + (0.87 - 0.93) * (ranking - 2.0) / (5 - 2);
  ELSIF ranking BETWEEN 5 AND 10 THEN
    RETURN 0.87 + (0.75 - 0.87) * (ranking - 5.0) / (10 - 5);
  ELSIF ranking BETWEEN 10 AND 25 THEN
    RETURN 0.75 + (0.55 - 0.75) * (ranking - 10.0) / (25 - 10);
  ELSIF ranking BETWEEN 25 AND 50 THEN
    RETURN 0.55 + (0.35 - 0.55) * (ranking - 25.0) / (50 - 25);
  ELSIF ranking BETWEEN 50 AND 100 THEN
    RETURN 0.35 + (0.22 - 0.35) * (ranking - 50.0) / (100 - 50);
  ELSIF ranking BETWEEN 100 AND 200 THEN
    RETURN 0.22 + (0.08 - 0.22) * (ranking - 100.0) / (200 - 100);
  ELSIF ranking BETWEEN 200 AND 300 THEN
    RETURN 0.08 + (0.0 - 0.08) * (ranking - 200.0) / (300 - 200);
  ELSE
    RETURN 0.0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to round to clean endings (000, 500, 600, 700, 800, 900)
CREATE OR REPLACE FUNCTION round_to_clean(value NUMERIC)
RETURNS INTEGER AS $$
DECLARE
  hundreds INTEGER;
  remainder INTEGER;
  clean_remainder INTEGER;
  result INTEGER;
BEGIN
  hundreds := FLOOR(value / 100);
  remainder := (value::INTEGER) % 100;
  
  -- Determine clean remainder
  IF remainder < 25 THEN clean_remainder := 0;
  ELSIF remainder < 55 THEN clean_remainder := 50;
  ELSIF remainder < 65 THEN clean_remainder := 60;
  ELSIF remainder < 75 THEN clean_remainder := 70;
  ELSIF remainder < 85 THEN clean_remainder := 80;
  ELSIF remainder < 95 THEN clean_remainder := 90;
  ELSE clean_remainder := 100;
  END IF;
  
  IF clean_remainder = 100 THEN
    result := (hundreds + 1) * 100;
  ELSE
    result := (hundreds * 100) + clean_remainder;
  END IF;
  
  -- Enforce min/max bounds (£5,000 - £12,500)
  IF result < 5000 THEN result := 5000;
  ELSIF result > 12500 THEN result := 12500;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Show current state
SELECT 
  '===== BEFORE RECALCULATION =====' as status,
  COUNT(*) as total_golfers,
  MIN(salary) as min_salary,
  MAX(salary) as max_salary,
  ROUND(AVG(salary)) as avg_salary
FROM public.competition_golfers;

-- Update all salaries using the new formula
UPDATE public.competition_golfers cg
SET salary = CASE
  WHEN g.world_ranking IS NULL OR g.world_ranking <= 0 THEN 5000
  ELSE round_to_clean(5000 + (7500 * calculate_owgr_factor(g.world_ranking)))
END
FROM public.golfers g
WHERE cg.golfer_id = g.id;

-- Show updated state
SELECT 
  '===== AFTER RECALCULATION =====' as status,
  COUNT(*) as total_golfers,
  MIN(salary) as min_salary,
  MAX(salary) as max_salary,
  ROUND(AVG(salary)) as avg_salary
FROM public.competition_golfers;

-- Show detailed breakdown by ranking tiers
SELECT 
  '===== SALARY BREAKDOWN BY TIER =====' as section,
  CASE
    WHEN g.world_ranking IS NULL OR g.world_ranking <= 0 THEN 'No Ranking'
    WHEN g.world_ranking = 1 THEN 'Rank #1'
    WHEN g.world_ranking BETWEEN 2 AND 5 THEN 'Rank #2-5'
    WHEN g.world_ranking BETWEEN 6 AND 10 THEN 'Rank #6-10'
    WHEN g.world_ranking BETWEEN 11 AND 25 THEN 'Rank #11-25'
    WHEN g.world_ranking BETWEEN 26 AND 50 THEN 'Rank #26-50'
    WHEN g.world_ranking BETWEEN 51 AND 100 THEN 'Rank #51-100'
    WHEN g.world_ranking BETWEEN 101 AND 200 THEN 'Rank #101-200'
    ELSE 'Rank #201+'
  END as ranking_tier,
  COUNT(*) as count,
  MIN(cg.salary) as min_salary,
  MAX(cg.salary) as max_salary,
  ROUND(AVG(cg.salary)) as avg_salary
FROM public.competition_golfers cg
JOIN public.golfers g ON cg.golfer_id = g.id
GROUP BY ranking_tier
ORDER BY max_salary DESC;

-- Show top 10 golfers by salary
SELECT 
  '===== TOP 10 SALARIES =====' as section,
  g.full_name,
  g.world_ranking,
  cg.salary,
  '£' || cg.salary::TEXT as formatted_salary
FROM public.competition_golfers cg
JOIN public.golfers g ON cg.golfer_id = g.id
ORDER BY cg.salary DESC, g.world_ranking ASC
LIMIT 10;

-- Validate cheapest 6 constraint (should be ≤ £51,000)
SELECT 
  '===== CHEAPEST 6 VALIDATION =====' as section,
  SUM(salary) as cheapest_six_total,
  '£' || SUM(salary)::TEXT as formatted_total,
  CASE 
    WHEN SUM(salary) <= 51000 THEN '✅ VALID (≤ £51,000)'
    ELSE '⚠️  EXCEEDS LIMIT (> £51,000)'
  END as validation_status,
  ROUND((SUM(salary)::NUMERIC / 60000) * 100, 1) || '%' as percentage_of_budget
FROM (
  SELECT salary
  FROM public.competition_golfers
  ORDER BY salary ASC
  LIMIT 6
) cheapest;

-- Clean up temporary functions
DROP FUNCTION IF EXISTS calculate_owgr_factor(INTEGER);
DROP FUNCTION IF EXISTS round_to_clean(NUMERIC);

-- Success message
SELECT '✅ All salaries recalculated using new £60,000 OWGR-based system!' as message;
SELECT '🏌️ Check the breakdowns above to verify salary distribution' as note;
SELECT '💰 Budget: £60,000 | Range: £5,000 - £12,500 | Team: 6 golfers' as system_info;

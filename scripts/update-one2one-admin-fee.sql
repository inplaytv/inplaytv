-- ===================================================================
-- UPDATE ONE 2 ONE ADMIN FEE PERCENTAGE
-- This script updates the admin_fee_percent for all ONE 2 ONE templates
-- The admin fee determines the platform's cut from the combined entry fees
-- Prize calculation: (entry_fee * 2 * (100 - admin_fee_percent)) / 100
-- ===================================================================

-- Current default is 10%
-- Adjust the percentage below to your desired value (e.g., 5, 10, 15)

-- Update admin fee percentage for ALL ONE 2 ONE templates
-- ONE 2 ONE templates are identified by having rounds_covered (not competition_type_id)
UPDATE competition_templates
SET 
  admin_fee_percent = 10,  -- CHANGE THIS VALUE to adjust the admin fee (e.g., 5 for 5%, 15 for 15%)
  updated_at = NOW()
WHERE status = 'active'
  AND rounds_covered IS NOT NULL  -- Only ONE 2 ONE templates (regular comps use competition_type_id)
  AND competition_type_id IS NULL;  -- ONE 2 ONE templates don't have a competition_type_id

-- Verify the changes and show prize calculations
SELECT 
  rounds_covered,
  entry_fee_pennies / 100.0 as entry_fee_pounds,
  admin_fee_percent,
  (entry_fee_pennies * 2 * (100 - admin_fee_percent)) / 10000.0 as winner_prize_pounds,
  (entry_fee_pennies * 2 * admin_fee_percent) / 10000.0 as admin_cut_pounds,
  CASE 
    WHEN array_length(rounds_covered, 1) = 4 THEN 'All Rounds Challenge'
    WHEN rounds_covered[1] = 1 THEN 'Round 1 Challenge'
    WHEN rounds_covered[1] = 2 THEN 'Round 2 Challenge'
    WHEN rounds_covered[1] = 3 THEN 'Round 3 Challenge'
    WHEN rounds_covered[1] = 4 THEN 'Round 4 Challenge'
  END as challenge_name,
  status,
  updated_at
FROM competition_templates
WHERE status = 'active'
ORDER BY 
  array_length(rounds_covered, 1) DESC,  -- All Rounds first (4 rounds)
  rounds_covered[1];  -- Then by round number

-- Example calculations with different admin fees:
-- 
-- With 5% admin fee on £10 entry:
--   Combined pot: £20
--   Winner gets: £19 (95%)
--   Platform keeps: £1 (5%)
--
-- With 10% admin fee on £10 entry:
--   Combined pot: £20
--   Winner gets: £18 (90%)
--   Platform keeps: £2 (10%)
--
-- With 15% admin fee on £10 entry:
--   Combined pot: £20
--   Winner gets: £17 (85%)
--   Platform keeps: £3 (15%)

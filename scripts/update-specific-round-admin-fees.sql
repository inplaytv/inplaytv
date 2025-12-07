-- ===================================================================
-- UPDATE ADMIN FEE FOR SPECIFIC ROUND TEMPLATES
-- Edit the numbers below and run this entire script
-- ===================================================================

-- Round 1 Only: 5% admin fee
UPDATE competition_templates
SET admin_fee_percent = 10, updated_at = NOW()
WHERE status = 'active' AND rounds_covered = ARRAY[1];

-- Round 2 Only: 10% admin fee
UPDATE competition_templates
SET admin_fee_percent = 10, updated_at = NOW()
WHERE status = 'active' AND rounds_covered = ARRAY[2];

-- Round 3 Only: 10% admin fee
UPDATE competition_templates
SET admin_fee_percent = 10, updated_at = NOW()
WHERE status = 'active' AND rounds_covered = ARRAY[3];

-- Round 4 Only: 15% admin fee (higher for final round)
UPDATE competition_templates
SET admin_fee_percent = 10, updated_at = NOW()
WHERE status = 'active' AND rounds_covered = ARRAY[4];

-- All 4 Rounds: 20% admin fee (highest for full tournament)
UPDATE competition_templates
SET admin_fee_percent = 10, updated_at = NOW()
WHERE status = 'active' AND rounds_covered = ARRAY[1,2,3,4];

-- Verify the changes
SELECT 
  CASE 
    WHEN array_length(rounds_covered, 1) = 4 THEN 'All 4 Rounds'
    WHEN rounds_covered[1] = 1 THEN 'Round 1 Only'
    WHEN rounds_covered[1] = 2 THEN 'Round 2 Only'
    WHEN rounds_covered[1] = 3 THEN 'Round 3 Only'
    WHEN rounds_covered[1] = 4 THEN 'Round 4 Only'
  END as template_name,
  entry_fee_pennies / 100.0 as default_entry_pounds,
  admin_fee_percent,
  (entry_fee_pennies * 2 * (100 - admin_fee_percent)) / 10000.0 as winner_gets_pounds,
  (entry_fee_pennies * 2 * admin_fee_percent) / 10000.0 as platform_cut_pounds,
  status,
  updated_at
FROM competition_templates
WHERE rounds_covered IS NOT NULL
ORDER BY 
  array_length(rounds_covered, 1) DESC,
  rounds_covered[1];

-- ===================================================================
-- EXAMPLE: Different fees for different rounds
-- ===================================================================
-- Round 1 Only: 5% (low fee to encourage early participation)
-- Round 2 Only: 10% (standard fee)
-- Round 3 Only: 10% (standard fee)
-- Round 4 Only: 15% (higher fee for final round excitement)
-- All 4 Rounds: 20% (highest fee for complete tournament)
-- ===================================================================

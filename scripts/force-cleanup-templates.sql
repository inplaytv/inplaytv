/* ===================================================================
   FORCE CLEANUP - DELETE ALL AND RECREATE
   ===================================================================
   
   This will delete ALL templates and recreate only the 5 we need.
   
   =================================================================== */

-- Delete all existing templates
DELETE FROM competition_templates;

-- Now insert the 5 templates fresh
INSERT INTO competition_templates (
  name,
  short_name,
  description,
  entry_fee_pennies,
  admin_fee_percent,
  max_players,
  rounds_covered,
  reg_close_round,
  status
) VALUES 
(
  'ONE 2 ONE - All 4 Rounds',
  'All Rounds',
  'Challenge another player across all 4 rounds of the tournament',
  1000,
  10,
  2,
  ARRAY[1, 2, 3, 4],
  1,
  'active'
),
(
  'ONE 2 ONE - Round 1',
  'Round 1',
  'Challenge another player for Round 1 only',
  1000,
  10,
  2,
  ARRAY[1],
  1,
  'active'
),
(
  'ONE 2 ONE - Round 2',
  'Round 2',
  'Challenge another player for Round 2 only',
  1000,
  10,
  2,
  ARRAY[2],
  2,
  'active'
),
(
  'ONE 2 ONE - Round 3',
  'Round 3',
  'Challenge another player for Round 3 only',
  1000,
  10,
  2,
  ARRAY[3],
  3,
  'active'
),
(
  'ONE 2 ONE - Round 4',
  'Round 4',
  'Challenge another player for the final round only',
  1000,
  10,
  2,
  ARRAY[4],
  4,
  'active'
);

-- Verify we now have exactly 5 templates
SELECT 
  id,
  name,
  short_name,
  rounds_covered,
  entry_fee_pennies / 100.0 as entry_fee_pounds,
  admin_fee_percent,
  status
FROM competition_templates
ORDER BY 
  CASE WHEN array_length(rounds_covered, 1) = 4 THEN 0 ELSE 1 END,
  rounds_covered[1];

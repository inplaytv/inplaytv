/* ===================================================================
   CLEANUP DUPLICATE ONE 2 ONE TEMPLATES
   ===================================================================
   
   This will find and remove duplicate templates, keeping only the
   oldest entry for each unique combination of name and rounds_covered.
   
   =================================================================== */

-- First, let's see what we have
SELECT 
  id,
  name,
  short_name,
  rounds_covered,
  created_at
FROM competition_templates
ORDER BY rounds_covered, created_at;

-- Delete duplicates, keeping only the oldest entry for each unique template
DELETE FROM competition_templates
WHERE id NOT IN (
  SELECT DISTINCT ON (name, rounds_covered) id
  FROM competition_templates
  ORDER BY name, rounds_covered, created_at ASC
);

-- Verify the cleanup
SELECT 
  id,
  name,
  short_name,
  entry_fee_pennies / 100.0 as entry_fee_pounds,
  admin_fee_percent,
  rounds_covered,
  status,
  created_at
FROM competition_templates
ORDER BY 
  CASE WHEN array_length(rounds_covered, 1) = 4 THEN 0 ELSE 1 END,
  rounds_covered[1];

/* ===================================================================
   EXPECTED RESULT:
   
   Should now have exactly 5 templates:
   1. ONE 2 ONE - All 4 Rounds
   2. ONE 2 ONE - Round 1
   3. ONE 2 ONE - Round 2
   4. ONE 2 ONE - Round 3
   5. ONE 2 ONE - Round 4
   
   =================================================================== */

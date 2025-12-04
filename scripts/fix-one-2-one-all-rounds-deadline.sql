-- ===================================================================
-- FIX: ONE 2 ONE All Rounds Registration Deadline
-- Run this in Supabase SQL Editor to update existing templates
-- ===================================================================

-- Update the "All Rounds" template to close at Round 1 start (not stay open)
UPDATE public.competition_templates
SET reg_close_round = 1
WHERE name = 'ONE 2 ONE - All Rounds'
  AND reg_close_round IS NULL;

-- Verify the change
SELECT 
  name,
  short_name,
  rounds_covered,
  reg_close_round,
  status
FROM public.competition_templates
WHERE name LIKE 'ONE 2 ONE%'
ORDER BY rounds_covered;

-- Expected result:
-- "ONE 2 ONE - All Rounds" should have reg_close_round = 1
-- "ONE 2 ONE - Round 1" should have reg_close_round = 1
-- "ONE 2 ONE - Round 2" should have reg_close_round = 2
-- "ONE 2 ONE - Round 3" should have reg_close_round = 3
-- "ONE 2 ONE - Round 4" should have reg_close_round = 4

-- ===================================================================
-- FIX: Final Strike Registration Close Time (Simple Version)
-- Run each query separately in Supabase SQL Editor
-- ===================================================================

-- First, find the competition_type_id for 'final_strike'
-- Then update the registration close time

-- QUERY 1: Fix Final Strike reg_close_at to be 15 minutes before Round 4 tee time
UPDATE tournament_competitions
SET 
  reg_close_at = (
    SELECT round4_tee_time - INTERVAL '15 minutes'
    FROM tournaments 
    WHERE id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
  ),
  status = 'open',
  updated_at = NOW()
WHERE tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
  AND competition_type_id = (
    SELECT id FROM competition_types WHERE slug = 'final_strike'
  );

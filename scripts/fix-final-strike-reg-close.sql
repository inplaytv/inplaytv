-- ===================================================================
-- CHECK AND FIX: Final Strike Registration Close Time
-- ===================================================================

-- Check all competitions for RSM Classic
SELECT 
  id,
  competition_type,
  round_start,
  round_end,
  reg_close_at,
  reg_close_at AT TIME ZONE 'America/New_York' as reg_close_local,
  NOW() as current_utc,
  NOW() AT TIME ZONE 'America/New_York' as current_local,
  reg_close_at < NOW() as is_closed,
  status
FROM tournament_competitions
WHERE tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
ORDER BY round_start;

-- Get tournament tee times for reference
SELECT 
  name,
  round4_tee_time,
  round4_tee_time AT TIME ZONE timezone as round4_local
FROM tournaments
WHERE id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce';

-- Fix Final Strike reg_close_at to be 15 minutes before Round 4 tee time
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
  AND competition_type = 'final_strike';

-- Verify the fix
SELECT 
  competition_type,
  reg_close_at AT TIME ZONE 'America/New_York' as reg_close_local,
  NOW() AT TIME ZONE 'America/New_York' as current_local,
  status
FROM tournament_competitions
WHERE tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
  AND competition_type = 'final_strike';

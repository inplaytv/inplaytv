-- ===================================================================
-- ADD ROUND TEE TIMES TO TOURNAMENTS
-- Stores first tee time for each round to calculate precise registration close times
-- ===================================================================

-- Add columns for round tee times (earliest tee time for each round)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS round1_tee_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round2_tee_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round3_tee_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round4_tee_time TIMESTAMPTZ;

-- Add comment explaining the columns
COMMENT ON COLUMN public.tournaments.round1_tee_time IS 'First tee time for Round 1 - used to calculate registration close times';
COMMENT ON COLUMN public.tournaments.round2_tee_time IS 'First tee time for Round 2 - used to calculate registration close times';
COMMENT ON COLUMN public.tournaments.round3_tee_time IS 'First tee time for Round 3 - used to calculate registration close times';
COMMENT ON COLUMN public.tournaments.round4_tee_time IS 'First tee time for Round 4 - used to calculate registration close times';

-- Create helper function to calculate registration close time
-- Returns: tee_time - 15 minutes (if tee_time provided), otherwise fallback to 6:30 AM on that day
CREATE OR REPLACE FUNCTION calculate_reg_close_time(
  tournament_start_date TIMESTAMPTZ,
  round_number INTEGER,
  round_tee_time TIMESTAMPTZ,
  tournament_timezone TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If we have actual tee time from DataGolf, use it minus 15 minutes
  IF round_tee_time IS NOT NULL THEN
    RETURN round_tee_time - INTERVAL '15 minutes';
  END IF;
  
  -- Fallback: Use 6:30 AM on the day the round starts (in tournament timezone)
  RETURN (
    (tournament_start_date AT TIME ZONE COALESCE(tournament_timezone, 'UTC') + 
     INTERVAL '1 day' * (round_number - 1))::date || ' 06:30:00'
  )::timestamp AT TIME ZONE COALESCE(tournament_timezone, 'UTC');
END;
$$;

-- Create helper function to get round tee time for a tournament
CREATE OR REPLACE FUNCTION get_round_tee_time(
  tournament_id UUID,
  round_number INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tee_time TIMESTAMPTZ;
BEGIN
  SELECT 
    CASE round_number
      WHEN 1 THEN round1_tee_time
      WHEN 2 THEN round2_tee_time
      WHEN 3 THEN round3_tee_time
      WHEN 4 THEN round4_tee_time
      ELSE NULL
    END
  INTO tee_time
  FROM tournaments
  WHERE id = tournament_id;
  
  RETURN tee_time;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_reg_close_time TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_round_tee_time TO authenticated, anon, service_role;

-- Example usage:
-- ============
-- 1. Set tee times (from DataGolf or manually):
--    UPDATE tournaments 
--    SET round1_tee_time = '2025-11-20 07:30:00-05:00',
--        round2_tee_time = '2025-11-21 07:45:00-05:00',
--        round3_tee_time = '2025-11-22 08:00:00-05:00',
--        round4_tee_time = '2025-11-23 08:15:00-05:00'
--    WHERE slug = 'the-rsm-classic';
--
-- 2. Calculate reg_close_at for competitions:
--    SELECT calculate_reg_close_time(
--      tournament_start_date := '2025-11-20'::timestamptz,
--      round_number := 4,
--      round_tee_time := '2025-11-23 08:15:00-05:00'::timestamptz,
--      tournament_timezone := 'America/New_York'
--    );
--    -- Returns: 2025-11-23 08:00:00-05:00 (15 minutes before tee time)
--
-- 3. Get tee time for a specific round:
--    SELECT get_round_tee_time(tournament_id, 4);

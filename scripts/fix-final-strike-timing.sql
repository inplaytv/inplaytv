-- Quick fix: Update Final Strike competition to use correct Round 4 tee time
-- Then apply the trigger to prevent this from happening again

-- First, fix the existing Final Strike competition
DO $$
DECLARE
  v_comp_id uuid;
  v_tourn_id uuid;
  v_round4_time timestamptz;
BEGIN
  -- Find the Final Strike competition and its tournament
  SELECT tc.id, tc.tournament_id, t.round_4_start
  INTO v_comp_id, v_tourn_id, v_round4_time
  FROM tournament_competitions tc
  JOIN tournaments t ON t.id = tc.tournament_id
  JOIN competition_types ct ON ct.id = tc.competition_type_id
  WHERE ct.name = 'Final Strike'
  AND t.name ILIKE '%thanet%'
  ORDER BY tc.created_at DESC
  LIMIT 1;

  IF v_comp_id IS NOT NULL AND v_round4_time IS NOT NULL THEN
    -- Update the competition with correct times
    UPDATE tournament_competitions
    SET 
      start_at = v_round4_time,
      reg_close_at = v_round4_time - INTERVAL '15 minutes',
      updated_at = NOW()
    WHERE id = v_comp_id;
    
    RAISE NOTICE 'Fixed Final Strike competition: start_at = %, reg_close_at = %', 
      v_round4_time, 
      v_round4_time - INTERVAL '15 minutes';
  ELSE
    RAISE NOTICE 'No Final Strike competition found or no round4_tee_time set';
  END IF;
END $$;

-- Now check all competitions for timing issues
SELECT 
  t.name AS tournament,
  ct.name AS competition,
  tc.status,
  tc.start_at,
  tc.reg_close_at,
  tc.start_at - INTERVAL '15 minutes' AS should_be_reg_close,
  CASE 
    WHEN tc.reg_close_at = tc.start_at - INTERVAL '15 minutes' THEN '✓ Correct'
    ELSE '✗ WRONG!'
  END AS timing_check
FROM tournament_competitions tc
JOIN tournaments t ON t.id = tc.tournament_id
JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE t.name ILIKE '%thanet%'
ORDER BY tc.created_at;

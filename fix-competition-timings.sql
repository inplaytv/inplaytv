-- ============================================================================
-- Fix Competition Timings for Clubhouse
-- ============================================================================
-- ALL competitions open 5 days before Round 1 starts
-- Each competition closes 15 minutes before its respective round starts
--
-- NOTE: These are DEFAULT timings. Admins can manually override via admin panel
--       for weather delays or schedule changes.
-- ============================================================================

-- Update timings for each competition based on their name and event
UPDATE clubhouse_competitions cc
SET 
  opens_at = e.round1_tee_time - INTERVAL '5 days',
  closes_at = CASE 
    WHEN cc.name = 'All 4 Rounds' THEN e.round1_tee_time - INTERVAL '15 minutes'
    WHEN cc.name = 'Round 1' THEN e.round1_tee_time - INTERVAL '15 minutes'
    WHEN cc.name = 'Round 2' THEN e.round2_tee_time - INTERVAL '15 minutes'
    WHEN cc.name = 'Round 3' THEN e.round3_tee_time - INTERVAL '15 minutes'
    WHEN cc.name = 'Round 4' THEN e.round4_tee_time - INTERVAL '15 minutes'
  END,
  starts_at = CASE 
    WHEN cc.name = 'All 4 Rounds' THEN e.round1_tee_time
    WHEN cc.name = 'Round 1' THEN e.round1_tee_time
    WHEN cc.name = 'Round 2' THEN e.round2_tee_time
    WHEN cc.name = 'Round 3' THEN e.round3_tee_time
    WHEN cc.name = 'Round 4' THEN e.round4_tee_time
  END,
  ends_at = CASE 
    WHEN cc.name = 'All 4 Rounds' THEN e.round4_tee_time + INTERVAL '8 hours'
    WHEN cc.name = 'Round 1' THEN e.round1_tee_time + INTERVAL '8 hours'
    WHEN cc.name = 'Round 2' THEN e.round2_tee_time + INTERVAL '8 hours'
    WHEN cc.name = 'Round 3' THEN e.round3_tee_time + INTERVAL '8 hours'
    WHEN cc.name = 'Round 4' THEN e.round4_tee_time + INTERVAL '8 hours'
  END
FROM clubhouse_events e
WHERE cc.event_id = e.id;

-- Verify the timings
SELECT 
  e.name as event_name,
  cc.name as competition_name,
  e.registration_opens_at as event_reg_opens,
  cc.opens_at as comp_opens,
  cc.closes_at as comp_closes,
  cc.starts_at as comp_starts,
  cc.ends_at as comp_ends,
  CASE 
    WHEN cc.name = 'All 4 Rounds' THEN e.round1_tee_time
    WHEN cc.name = 'Round 1' THEN e.round1_tee_time
    WHEN cc.name = 'Round 2' THEN e.round2_tee_time
    WHEN cc.name = 'Round 3' THEN e.round3_tee_time
    WHEN cc.name = 'Round 4' THEN e.round4_tee_time
  END as expected_start
FROM clubhouse_competitions cc
JOIN clubhouse_events e ON e.id = cc.event_id
ORDER BY e.created_at, 
  CASE cc.name
    WHEN 'All 4 Rounds' THEN 1
    WHEN 'Round 1' THEN 2
    WHEN 'Round 2' THEN 3
    WHEN 'Round 3' THEN 4
    WHEN 'Round 4' THEN 5
  END;

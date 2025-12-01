-- Update competition status auto-update function
-- This will change 'upcoming' to 'reg_open' 6 days before tournament starts
-- and handle other status transitions based on dates

CREATE OR REPLACE FUNCTION auto_update_competition_statuses()
RETURNS TABLE (updated_count INTEGER) AS $$
DECLARE
  update_count INTEGER := 0;
BEGIN
  -- 1. Update 'upcoming' to 'reg_open' 6 days before tournament start
  UPDATE tournament_competitions tc
  SET status = 'reg_open'
  FROM tournaments t
  WHERE tc.tournament_id = t.id
    AND tc.status = 'upcoming'
    AND t.start_date <= CURRENT_DATE + INTERVAL '6 days'
    AND (tc.reg_close_at IS NULL OR tc.reg_close_at > NOW());
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- 2. Update 'reg_open' to 'reg_closed' when registration closes
  UPDATE tournament_competitions
  SET status = 'reg_closed'
  WHERE status = 'reg_open'
    AND reg_close_at IS NOT NULL
    AND reg_close_at <= NOW();
  
  GET DIAGNOSTICS update_count = update_count + ROW_COUNT;
  
  -- 3. Update 'reg_closed' to 'live' when tournament starts
  UPDATE tournament_competitions tc
  SET status = 'live'
  FROM tournaments t
  WHERE tc.tournament_id = t.id
    AND tc.status = 'reg_closed'
    AND t.start_date <= CURRENT_DATE;
  
  GET DIAGNOSTICS update_count = update_count + ROW_COUNT;
  
  -- 4. Update 'live' to 'completed' when tournament ends
  UPDATE tournament_competitions tc
  SET status = 'completed'
  FROM tournaments t
  WHERE tc.tournament_id = t.id
    AND tc.status = 'live'
    AND t.end_date < CURRENT_DATE;
  
  GET DIAGNOSTICS update_count = update_count + ROW_COUNT;
  
  RETURN QUERY SELECT update_count;
END;
$$ LANGUAGE plpgsql;

-- Run it once to update existing competitions
SELECT * FROM auto_update_competition_statuses();

-- Check Hero World Challenge competitions
SELECT 
  ct.name as competition_type,
  tc.status,
  tc.entry_fee_pennies / 100 as entry_fee_pounds,
  t.start_date,
  CURRENT_DATE + INTERVAL '6 days' as six_days_from_now,
  CASE 
    WHEN t.start_date <= CURRENT_DATE + INTERVAL '6 days' THEN 'Should be reg_open'
    ELSE 'Should stay upcoming'
  END as expected_status
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.slug = 'hero-world-challenge';

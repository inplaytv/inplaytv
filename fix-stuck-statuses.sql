-- Fix competitions with wrong status based on current time
-- If reg_close has passed and competition has started, set to 'live'
-- If reg_close has passed but not started yet, set to 'reg_closed'

UPDATE tournament_competitions
SET status = 'live'
WHERE status = 'reg_open'
AND reg_close_at < NOW()
AND start_at <= NOW();

UPDATE tournament_competitions
SET status = 'reg_closed'
WHERE status = 'reg_open'
AND reg_close_at < NOW()
AND start_at > NOW();

-- Verify the fix
SELECT 
  t.name AS tournament,
  ct.name AS competition,
  tc.status,
  tc.reg_close_at,
  tc.start_at,
  NOW() as current_time,
  CASE 
    WHEN tc.reg_close_at < NOW() AND tc.start_at <= NOW() THEN 'Should be LIVE'
    WHEN tc.reg_close_at < NOW() AND tc.start_at > NOW() THEN 'Should be REG_CLOSED'
    WHEN tc.reg_close_at > NOW() THEN 'Should be REG_OPEN'
    ELSE 'OK'
  END as expected_status
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.name IN ('Mister G''s Open', 'THE THANET OPEN', 'THE GREENIDGE OPEN')
ORDER BY t.name, ct.name;

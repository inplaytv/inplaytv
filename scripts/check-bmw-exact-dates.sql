-- Check BMW Australian PGA Championship exact dates and status
SELECT 
  name,
  start_date,
  end_date,
  status,
  is_visible,
  created_at,
  CASE 
    WHEN start_date > NOW() THEN '🔵 UPCOMING - Not started yet'
    WHEN end_date < NOW() THEN '🏁 COMPLETED - Finished'
    WHEN start_date <= NOW() AND end_date >= NOW() THEN '🔴 LIVE - In progress right now'
    ELSE '❓ UNKNOWN'
  END as current_status
FROM tournaments
WHERE name ILIKE '%BMW Australian PGA%';

-- Check the competitions
SELECT 
  t.name as tournament_name,
  ct.name as competition_name,
  tc.status as comp_status,
  tc.reg_close_at,
  CASE 
    WHEN tc.reg_close_at > NOW() THEN '✅ OPEN - Can still register'
    WHEN tc.reg_close_at <= NOW() THEN '❌ CLOSED - Registration ended'
    ELSE '❓ NO REG CLOSE DATE'
  END as registration_status
FROM tournaments t
JOIN tournament_competitions tc ON tc.tournament_id = t.id
JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE t.name ILIKE '%BMW Australian PGA%'
ORDER BY tc.status, ct.name;

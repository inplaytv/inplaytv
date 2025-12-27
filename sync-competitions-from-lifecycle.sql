-- Sync ALL competition times from their tournament's lifecycle manager settings
-- reg_open_at = tournament.registration_opens_at
-- reg_close_at = competition.start_at - 15 minutes

UPDATE tournament_competitions tc
SET 
  reg_open_at = t.registration_opens_at,
  reg_close_at = tc.start_at - INTERVAL '15 minutes'
FROM tournaments t
WHERE tc.tournament_id = t.id
AND t.registration_opens_at IS NOT NULL
AND tc.start_at IS NOT NULL;

-- Verify the sync
SELECT 
  t.name AS tournament,
  ct.name AS competition,
  tc.status,
  t.registration_opens_at AS lifecycle_reg_open,
  tc.reg_open_at AS comp_reg_open,
  tc.reg_close_at AS comp_reg_close,
  tc.start_at AS comp_start,
  CASE 
    WHEN tc.reg_open_at = t.registration_opens_at THEN '✅'
    ELSE '❌ MISMATCH'
  END AS sync_status
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.name IN ('Mister G''s Open', 'THE THANET OPEN', 'THE GREENIDGE OPEN')
ORDER BY t.name, ct.name;

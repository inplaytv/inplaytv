-- Check Nedbank tournament round times
SELECT 
  name,
  slug,
  start_date,
  current_round,
  round_1_start,
  round_2_start,
  round_3_start,
  round_4_start,
  NOW() as current_time,
  CASE 
    WHEN round_1_start IS NULL THEN 'NO ROUND 1 START TIME SET'
    WHEN NOW() < round_1_start THEN 'Before Round 1 (registration should be OPEN)'
    ELSE 'After Round 1 (registration should be CLOSED)'
  END as registration_status
FROM public.tournaments
WHERE slug = 'nedbank-golf-challenge-in-honour-of-gary-player';

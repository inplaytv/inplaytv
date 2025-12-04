-- Check Nedbank tournament structure
SELECT 
  name,
  slug,
  start_date,
  end_date,
  current_round,
  status,
  NOW() as current_time,
  CASE 
    WHEN NOW() < start_date THEN 'Before tournament'
    WHEN NOW() > end_date THEN 'After tournament'
    ELSE 'During tournament'
  END as tournament_status
FROM public.tournaments
WHERE slug = 'nedbank-golf-challenge-in-honour-of-gary-player';

-- Check if there are any rounds table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%round%';

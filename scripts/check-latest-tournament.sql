-- Check the latest created tournaments
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date,
  created_at
FROM public.tournaments
ORDER BY created_at DESC
LIMIT 6;

-- Check competitions for the latest tournament
SELECT 
  t.name as tournament_name,
  ct.name as competition_name,
  tc.entry_fee_pennies,
  tc.entry_fee_pennies / 100.0 as entry_fee_pounds,
  tc.entrants_cap,
  tc.admin_fee_percent,
  tc.status,
  tc.created_at
FROM public.tournament_competitions tc
JOIN public.tournaments t ON tc.tournament_id = t.id
JOIN public.competition_types ct ON tc.competition_type_id = ct.id
WHERE t.id = (
  SELECT id FROM public.tournaments 
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY tc.created_at;

-- Count visible vs hidden tournaments
SELECT 
  is_visible,
  COUNT(*) as count
FROM public.tournaments
GROUP BY is_visible;

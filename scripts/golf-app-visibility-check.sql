-- Quick check: What tournaments should be visible on golf app?
SELECT 
  t.name,
  t.slug,
  t.status,
  t.is_visible,
  COUNT(tc.id) as competition_count,
  CASE 
    WHEN t.is_visible = true AND t.status = 'upcoming' AND COUNT(tc.id) >= 3 THEN '✅ SHOULD SHOW on golf app'
    WHEN t.is_visible = false THEN '❌ Hidden by admin'
    WHEN t.status != 'upcoming' THEN '⚠️ Wrong status'
    WHEN COUNT(tc.id) < 3 THEN '⚠️ Missing competitions'
    ELSE '❓ Unknown issue'
  END as golf_app_status
FROM public.tournaments t
LEFT JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
GROUP BY t.id, t.name, t.slug, t.status, t.is_visible
ORDER BY t.start_date ASC;

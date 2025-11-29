-- Complete visibility check for BMW Australian PGA Championship
SELECT 
  t.name,
  t.slug,
  t.status as tournament_status,
  t.is_visible,
  t.start_date,
  t.end_date,
  COUNT(DISTINCT tc.id) as total_competitions,
  COUNT(DISTINCT CASE WHEN tc.status = 'reg_open' THEN tc.id END) as reg_open_comps,
  COUNT(DISTINCT CASE WHEN tc.status = 'live' THEN tc.id END) as live_comps,
  COUNT(DISTINCT tg.golfer_id) as total_golfers,
  CASE 
    WHEN t.is_visible = true AND t.status IN ('upcoming', 'live') THEN '✅ SHOULD BE VISIBLE on web app'
    WHEN t.is_visible = false THEN '❌ HIDDEN by is_visible=false'
    WHEN t.status NOT IN ('upcoming', 'live') THEN '❌ HIDDEN by status=' || t.status
    ELSE '❓ UNKNOWN ISSUE'
  END as visibility_status
FROM tournaments t
LEFT JOIN tournament_competitions tc ON tc.tournament_id = t.id
LEFT JOIN tournament_golfers tg ON tg.tournament_id = t.id
WHERE t.name ILIKE '%BMW Australian PGA%'
GROUP BY t.id, t.name, t.slug, t.status, t.is_visible, t.start_date, t.end_date;

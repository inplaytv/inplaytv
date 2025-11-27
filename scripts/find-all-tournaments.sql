-- ===================================================================
-- FIND ALL TOURNAMENTS - COMPREHENSIVE SEARCH
-- This will find tournaments regardless of their state
-- ===================================================================

-- 1. Count ALL tournaments (including any with NULL values)
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(CASE WHEN is_visible IS NULL THEN 1 END) as null_visibility_count,
  COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_count,
  COUNT(CASE WHEN is_visible = false THEN 1 END) as hidden_count
FROM public.tournaments;

-- 2. Show ALL tournaments with ALL fields
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date,
  end_date,
  location,
  description,
  created_at,
  updated_at
FROM public.tournaments
ORDER BY created_at DESC;

-- 3. Check if tournaments were deleted recently (if you have audit logs)
-- This depends on your database setup

-- 4. Search for tournaments created in last 24 hours
SELECT 
  id,
  name,
  slug,
  status,
  is_visible,
  created_at,
  NOW() - created_at as age
FROM public.tournaments
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Check if there are tournaments with different statuses
SELECT 
  status,
  COUNT(*) as count,
  string_agg(name, ', ') as tournament_names
FROM public.tournaments
GROUP BY status;

-- 6. Check tournament_competitions table to see if orphaned competitions exist
SELECT 
  tc.id,
  tc.tournament_id,
  t.name as tournament_name,
  ct.name as competition_name,
  tc.created_at
FROM public.tournament_competitions tc
LEFT JOIN public.tournaments t ON tc.tournament_id = t.id
JOIN public.competition_types ct ON tc.competition_type_id = ct.id
ORDER BY tc.created_at DESC
LIMIT 20;

-- 7. If you created 6 but only see 2, check if there were errors:
-- Look for tournaments without competitions (these might have failed)
SELECT 
  t.id,
  t.name,
  t.created_at,
  COUNT(tc.id) as competition_count,
  CASE 
    WHEN COUNT(tc.id) = 0 THEN '⚠️ No competitions - may have failed'
    WHEN COUNT(tc.id) < 3 THEN '⚠️ Incomplete - expected 3'
    ELSE '✅ Complete'
  END as status_check
FROM public.tournaments t
LEFT JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
GROUP BY t.id, t.name, t.created_at
ORDER BY t.created_at DESC;

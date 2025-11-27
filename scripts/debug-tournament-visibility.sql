-- ===================================================================
-- COMPREHENSIVE TOURNAMENT VISIBILITY CHECK
-- Use this to debug why tournaments aren't showing on golf app
-- ===================================================================

-- 1. Check ALL tournaments and their visibility status
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date,
  end_date,
  created_at,
  CASE 
    WHEN is_visible = true AND status = 'upcoming' THEN '✅ Should be visible'
    WHEN is_visible = false THEN '❌ Hidden by admin'
    WHEN status != 'upcoming' THEN '⚠️ Wrong status'
    ELSE '❓ Unknown issue'
  END as visibility_check
FROM public.tournaments
ORDER BY created_at DESC;

-- 2. Count tournaments by visibility and status
SELECT 
  status,
  is_visible,
  COUNT(*) as count
FROM public.tournaments
GROUP BY status, is_visible
ORDER BY status, is_visible;

-- 3. Check competitions for visible tournaments
SELECT 
  t.name as tournament_name,
  t.is_visible,
  t.status,
  COUNT(tc.id) as competition_count
FROM public.tournaments t
LEFT JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
GROUP BY t.id, t.name, t.is_visible, t.status
ORDER BY t.created_at DESC;

-- 4. If you need to make all upcoming tournaments visible:
-- UPDATE public.tournaments 
-- SET is_visible = true 
-- WHERE status = 'upcoming';

-- 5. Check specific tournament by name (replace with your tournament name)
SELECT 
  id,
  name,
  slug,
  status,
  is_visible,
  start_date,
  created_at
FROM public.tournaments
WHERE name ILIKE '%players%'
OR name ILIKE '%pga%'
OR name ILIKE '%open%'
ORDER BY created_at DESC
LIMIT 10;

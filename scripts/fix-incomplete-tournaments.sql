-- ===================================================================
-- FIX INCOMPLETE TOURNAMENTS
-- Removes tournaments that don't have proper competitions
-- ===================================================================

-- 1. First, let's see which tournaments have issues
SELECT 
  t.id,
  t.name,
  t.slug,
  t.created_at,
  COUNT(tc.id) as competition_count,
  CASE 
    WHEN COUNT(tc.id) = 0 THEN 'DELETE - No competitions'
    WHEN COUNT(tc.id) < 3 THEN 'DELETE - Incomplete'
    ELSE 'KEEP - Complete'
  END as action
FROM public.tournaments t
LEFT JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
GROUP BY t.id, t.name, t.slug, t.created_at
HAVING COUNT(tc.id) < 3
ORDER BY t.created_at DESC;

-- 2. Delete tournaments with no competitions (creation failed)
DELETE FROM public.tournaments
WHERE id IN (
  SELECT t.id
  FROM public.tournaments t
  LEFT JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
  GROUP BY t.id
  HAVING COUNT(tc.id) = 0
);

-- 3. Delete tournaments with incomplete competitions (< 3)
DELETE FROM public.tournaments
WHERE id IN (
  SELECT t.id
  FROM public.tournaments t
  LEFT JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
  GROUP BY t.id
  HAVING COUNT(tc.id) > 0 AND COUNT(tc.id) < 3
);

-- 4. Verify remaining tournaments are complete
SELECT 
  t.id,
  t.name,
  t.status,
  t.is_visible,
  COUNT(tc.id) as competition_count,
  string_agg(ct.name, ', ') as competitions
FROM public.tournaments t
LEFT JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
LEFT JOIN public.competition_types ct ON tc.competition_type_id = ct.id
GROUP BY t.id, t.name, t.status, t.is_visible
ORDER BY t.created_at DESC;

-- 5. Count final results
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_tournaments,
  'After cleanup' as note
FROM public.tournaments;

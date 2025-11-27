-- ===================================================================
-- FIX ALL TOURNAMENTS VISIBILITY
-- Ensure all tournaments have is_visible set correctly
-- ===================================================================

-- First, check current state
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_count,
  COUNT(CASE WHEN is_visible = false THEN 1 END) as hidden_count,
  COUNT(CASE WHEN is_visible IS NULL THEN 1 END) as null_count
FROM public.tournaments;

-- Update all NULL values to true
UPDATE public.tournaments 
SET is_visible = true 
WHERE is_visible IS NULL;

-- Show all tournaments with their visibility status
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
LIMIT 20;

-- Specifically check The Players Championship
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date
FROM public.tournaments
WHERE name ILIKE '%players%championship%'
   OR slug ILIKE '%players%championship%';

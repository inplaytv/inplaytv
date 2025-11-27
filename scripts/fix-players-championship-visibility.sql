-- Check and fix The Players Championship visibility
-- Run this in Supabase SQL Editor if the tournament still isn't showing

-- Check current status
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date,
  end_date
FROM public.tournaments
WHERE name LIKE '%Players Championship%'
OR slug LIKE '%players-championship%';

-- If is_visible is NULL or false, update it to true
UPDATE public.tournaments 
SET is_visible = true 
WHERE (name LIKE '%Players Championship%' OR slug LIKE '%players-championship%')
AND (is_visible IS NULL OR is_visible = false);

-- Verify the update
SELECT 
  id,
  name, 
  slug, 
  status, 
  is_visible,
  start_date,
  end_date
FROM public.tournaments
WHERE name LIKE '%Players Championship%'
OR slug LIKE '%players-championship%';

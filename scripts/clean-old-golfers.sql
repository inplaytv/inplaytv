-- Clean Old Tournament Golfer Data
-- Run this in Supabase SQL Editor before implementing DataGolf API golfer sync

-- STEP 0: Check if tables exist
-- Run this first to verify table structure
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tournaments', 'golfers', 'tournament_golfers')
ORDER BY tablename;

-- If tournament_golfers doesn't exist, you need to create it first
-- See: scripts/2025-01-tournament-golfers.sql

-- OPTION 1: View current golfer data to decide what to keep
-- Run this to see what's in the database
SELECT 
  t.name as tournament_name,
  t.slug,
  COUNT(tg.id) as golfer_count,
  MIN(tg.created_at) as oldest_link,
  MAX(tg.created_at) as newest_link
FROM public.tournaments t
LEFT JOIN public.tournament_golfers tg ON t.id = tg.tournament_id
GROUP BY t.id, t.name, t.slug
ORDER BY golfer_count DESC;

-- OPTION 2: Remove ALL tournament golfer links (keeps golfer records)
-- This clears the links but preserves golfer data for future use
-- UNCOMMENT TO RUN:
-- DELETE FROM public.tournament_golfers;

-- OPTION 3: Remove golfers that are NOT from DataGolf
-- (golfers without dg_id are manually created)
-- UNCOMMENT TO RUN:
/*
DELETE FROM public.tournament_golfers
WHERE golfer_id IN (
  SELECT id FROM public.golfers WHERE dg_id IS NULL
);
*/

-- OPTION 4: Remove specific tournament's golfers
-- Replace 'tournament-slug-here' with actual slug
-- UNCOMMENT TO RUN:
/*
DELETE FROM public.tournament_golfers
WHERE tournament_id IN (
  SELECT id FROM public.tournaments WHERE slug = 'tournament-slug-here'
);
*/

-- OPTION 5: Complete fresh start - remove ALL golfers
-- WARNING: This deletes all golfer records and their tournament links
-- UNCOMMENT TO RUN:
/*
TRUNCATE TABLE public.tournament_golfers CASCADE;
DELETE FROM public.golfers;
*/

-- After cleanup, verify the results:
SELECT 
  'Tournaments' as table_name, 
  COUNT(*) as count 
FROM public.tournaments
UNION ALL
SELECT 
  'Golfers' as table_name, 
  COUNT(*) as count 
FROM public.golfers
UNION ALL
SELECT 
  'Tournament Golfers' as table_name, 
  COUNT(*) as count 
FROM public.tournament_golfers;

-- Check which golfers have DataGolf IDs:
SELECT 
  CASE WHEN dg_id IS NOT NULL THEN 'Has DataGolf ID' ELSE 'No DataGolf ID' END as type,
  COUNT(*) as count
FROM public.golfers
GROUP BY CASE WHEN dg_id IS NOT NULL THEN 'Has DataGolf ID' ELSE 'No DataGolf ID' END;

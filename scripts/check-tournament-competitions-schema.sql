-- ===================================================================
-- CHECK TOURNAMENT COMPETITIONS TABLE SCHEMA
-- Run this in Supabase SQL Editor to see current column structure
-- ===================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tournament_competitions'
ORDER BY ordinal_position;

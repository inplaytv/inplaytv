-- ===================================================================
-- REMOVE UNIQUE CONSTRAINT ON TOURNAMENT COMPETITIONS
-- Run this in Supabase Dashboard SQL Editor
-- This allows multiple competitions of the same type with different fees
-- ===================================================================

-- Drop the unique constraint that prevents duplicate competition types per tournament
ALTER TABLE public.tournament_competitions 
DROP CONSTRAINT IF EXISTS tournament_competitions_tournament_id_competition_type_id_key;

-- Add comment explaining the change
COMMENT ON TABLE public.tournament_competitions IS 'Competition instances linking tournaments to competition types. Multiple instances of the same type are allowed (e.g., Full Course with £10 entry and Full Course with £50 entry).';

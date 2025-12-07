-- ===================================================================
-- Make competition_id nullable in competition_entries
-- Required for ONE 2 ONE support (uses instance_id instead)
-- ===================================================================

-- Remove NOT NULL constraint from competition_id
ALTER TABLE public.competition_entries 
ALTER COLUMN competition_id DROP NOT NULL;

-- Add constraint: at least one of competition_id or instance_id must be set
ALTER TABLE public.competition_entries
DROP CONSTRAINT IF EXISTS check_competition_or_instance;

ALTER TABLE public.competition_entries
ADD CONSTRAINT check_competition_or_instance 
CHECK (
  (competition_id IS NOT NULL AND instance_id IS NULL) OR
  (competition_id IS NULL AND instance_id IS NOT NULL)
);

COMMENT ON CONSTRAINT check_competition_or_instance ON public.competition_entries IS 'Ensures exactly one of competition_id or instance_id is set (regular competitions use competition_id, ONE 2 ONE uses instance_id)';

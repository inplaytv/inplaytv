-- ===================================================================
-- ADD ASSIGNED GOLFER GROUP TO COMPETITIONS
-- Run this in Supabase Dashboard SQL Editor
-- Allows competitions to remember which golfer group is assigned
-- ===================================================================

-- Add assigned_golfer_group_id column
ALTER TABLE public.tournament_competitions 
ADD COLUMN IF NOT EXISTS assigned_golfer_group_id UUID 
REFERENCES public.golfer_groups(id) ON DELETE SET NULL;

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_tournament_competitions_golfer_group 
ON public.tournament_competitions(assigned_golfer_group_id);

-- Add comment
COMMENT ON COLUMN public.tournament_competitions.assigned_golfer_group_id IS 
'The golfer group currently assigned to this competition. When set, golfers from this group are synced to competition_golfers table.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added assigned_golfer_group_id column to tournament_competitions';
  RAISE NOTICE '📝 Competitions can now remember which golfer group is assigned';
END $$;

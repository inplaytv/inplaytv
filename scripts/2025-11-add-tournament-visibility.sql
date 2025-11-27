-- ===================================================================
-- ADD VISIBILITY TOGGLE TO TOURNAMENTS
-- Add is_visible column to control tournament display on frontend
-- ===================================================================

-- Add is_visible column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_tournaments_visible ON public.tournaments(is_visible);

-- Add comment
COMMENT ON COLUMN public.tournaments.is_visible IS 'Controls whether tournament is displayed on the tournaments page. Admins can hide tournaments without deleting them.';

-- Update existing tournaments to be visible by default
UPDATE public.tournaments SET is_visible = true WHERE is_visible IS NULL;

-- Show results
SELECT 
  name, 
  slug, 
  status, 
  is_visible,
  start_date
FROM public.tournaments
ORDER BY start_date DESC
LIMIT 10;

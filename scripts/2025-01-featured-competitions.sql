-- Add featured flag to tournament_competitions table
-- This allows admin to mark competitions as featured

ALTER TABLE tournament_competitions 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS featured_message TEXT DEFAULT NULL;

-- Create index for faster featured competition queries
CREATE INDEX IF NOT EXISTS idx_tournament_competitions_featured 
ON tournament_competitions(is_featured, featured_order) 
WHERE is_featured = true;

-- Comments
COMMENT ON COLUMN tournament_competitions.is_featured IS 'Whether this competition should be featured on the main page';
COMMENT ON COLUMN tournament_competitions.featured_order IS 'Display order for featured competitions (1 = top, 2 = second, etc)';
COMMENT ON COLUMN tournament_competitions.featured_message IS 'Optional message to display on featured card (e.g., "Only 50 spots left!", "New tournament!")';

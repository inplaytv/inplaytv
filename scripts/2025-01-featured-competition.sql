-- Add featured_competition_id to tournaments table
-- This allows admin to select which competition to highlight on tournament cards

ALTER TABLE tournaments
ADD COLUMN featured_competition_id UUID REFERENCES tournament_competitions(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_tournaments_featured_competition ON tournaments(featured_competition_id);

-- Add comment
COMMENT ON COLUMN tournaments.featured_competition_id IS 'The competition to feature/highlight on tournament cards in the frontend';

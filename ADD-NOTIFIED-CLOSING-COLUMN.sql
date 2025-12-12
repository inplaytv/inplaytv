-- Add notified_closing column to track if we've sent closing notifications
ALTER TABLE tournament_competitions
ADD COLUMN IF NOT EXISTS notified_closing BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tournament_competitions_notified_closing 
ON tournament_competitions(notified_closing) 
WHERE notified_closing = FALSE;

-- Comment
COMMENT ON COLUMN tournament_competitions.notified_closing IS 'Whether closing notification has been sent for this competition';

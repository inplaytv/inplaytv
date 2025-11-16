-- Add world_ranking column to golfers table
ALTER TABLE golfers 
ADD COLUMN IF NOT EXISTS world_ranking INTEGER;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_golfers_world_ranking ON golfers(world_ranking);

-- Update any existing golfers that might have ranking data
COMMENT ON COLUMN golfers.world_ranking IS 'Official World Golf Ranking position';

-- Add hole-by-hole score columns to tournament_golfers table
-- These will store arrays of 18 hole scores for each round

ALTER TABLE tournament_golfers
ADD COLUMN IF NOT EXISTS r1_holes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS r2_holes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS r3_holes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS r4_holes JSONB DEFAULT NULL;

-- Add comment to explain the data structure
COMMENT ON COLUMN tournament_golfers.r1_holes IS 'Array of 18 hole scores for round 1, e.g., [4,3,4,5,4,4,3,4,4,4,4,4,3,5,4,4,4,4]';
COMMENT ON COLUMN tournament_golfers.r2_holes IS 'Array of 18 hole scores for round 2';
COMMENT ON COLUMN tournament_golfers.r3_holes IS 'Array of 18 hole scores for round 3';
COMMENT ON COLUMN tournament_golfers.r4_holes IS 'Array of 18 hole scores for round 4';

-- Add indexes for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_holes ON tournament_golfers 
USING GIN (r1_holes, r2_holes, r3_holes, r4_holes);

-- Example of how to insert hole-by-hole data:
-- UPDATE tournament_golfers 
-- SET r1_holes = '[4,3,4,5,4,4,3,4,4,4,4,4,3,5,4,4,4,4]'::jsonb
-- WHERE golfer_id = 'some-golfer-id' AND tournament_id = 'some-tournament-id';

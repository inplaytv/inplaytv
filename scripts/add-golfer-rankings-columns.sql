-- Add DataGolf rankings columns to golfers table
-- This allows us to store and display player rankings and skill data

ALTER TABLE golfers
ADD COLUMN IF NOT EXISTS dg_rank INTEGER,
ADD COLUMN IF NOT EXISTS owgr_rank INTEGER,
ADD COLUMN IF NOT EXISTS skill_estimate DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS primary_tour VARCHAR(50),
ADD COLUMN IF NOT EXISTS rankings_updated_at TIMESTAMPTZ;

-- Create index for ranking searches
CREATE INDEX IF NOT EXISTS idx_golfers_dg_rank ON golfers(dg_rank) WHERE dg_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_owgr_rank ON golfers(owgr_rank) WHERE owgr_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_skill_estimate ON golfers(skill_estimate DESC) WHERE skill_estimate IS NOT NULL;

-- Update existing golfers to mark when we don't have ranking data
COMMENT ON COLUMN golfers.dg_rank IS 'DataGolf world ranking (1-500+)';
COMMENT ON COLUMN golfers.owgr_rank IS 'Official World Golf Ranking';
COMMENT ON COLUMN golfers.skill_estimate IS 'DataGolf skill estimate (higher = better)';
COMMENT ON COLUMN golfers.primary_tour IS 'Primary tour (PGA, European, etc)';
COMMENT ON COLUMN golfers.rankings_updated_at IS 'Last time rankings data was synced from DataGolf';

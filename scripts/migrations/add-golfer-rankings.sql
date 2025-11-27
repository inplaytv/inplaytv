-- Add ranking columns to golfers table
ALTER TABLE golfers 
ADD COLUMN IF NOT EXISTS world_rank INTEGER,
ADD COLUMN IF NOT EXISTS skill_rating DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS form_rating DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS last_ranking_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ranking_source VARCHAR(50) DEFAULT 'manual';

-- Create index for faster ranking queries
CREATE INDEX IF NOT EXISTS idx_golfers_world_rank ON golfers(world_rank) WHERE world_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_last_ranking_update ON golfers(last_ranking_update);

-- Create ranking history table
CREATE TABLE IF NOT EXISTS golfer_ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
  world_rank INTEGER,
  skill_rating DECIMAL(6,2),
  form_rating DECIMAL(6,2),
  salary_pennies INTEGER,
  source VARCHAR(50) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for history queries
CREATE INDEX IF NOT EXISTS idx_ranking_history_golfer ON golfer_ranking_history(golfer_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_history_recorded ON golfer_ranking_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_history_source ON golfer_ranking_history(source);

-- Create ranking sync logs table
CREATE TABLE IF NOT EXISTS ranking_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- 'csv_upload', 'api_sync', 'manual'
  golfers_updated INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL, -- 'success', 'partial', 'failed'
  error_message TEXT,
  metadata JSONB,
  synced_by UUID REFERENCES auth.users(id),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_synced_at ON ranking_sync_logs(synced_at DESC);

-- Add comment for documentation
COMMENT ON TABLE golfer_ranking_history IS 'Historical tracking of golfer rankings and salary changes';
COMMENT ON TABLE ranking_sync_logs IS 'Audit log of all ranking synchronization operations';
COMMENT ON COLUMN golfers.world_rank IS 'Current world ranking (lower is better)';
COMMENT ON COLUMN golfers.skill_rating IS 'DataGolf skill rating or similar metric';
COMMENT ON COLUMN golfers.form_rating IS 'Recent form rating (0-100)';
COMMENT ON COLUMN golfers.ranking_source IS 'Source of ranking data: manual, datagolf, owgr, sportsdata, etc.';

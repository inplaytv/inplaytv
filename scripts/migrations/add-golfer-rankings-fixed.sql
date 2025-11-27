-- Step 1: Add ranking columns to existing golfers table
ALTER TABLE golfers 
ADD COLUMN IF NOT EXISTS world_rank INTEGER,
ADD COLUMN IF NOT EXISTS skill_rating DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS form_rating DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS last_ranking_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ranking_source VARCHAR(50) DEFAULT 'manual';

-- Step 2: Check if salary_pennies exists, if not add it with default
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'golfers' AND column_name = 'salary_pennies') THEN
        ALTER TABLE golfers ADD COLUMN salary_pennies INTEGER DEFAULT 10000;
        -- Default £100.00 (10000 pennies) for existing golfers
        UPDATE golfers SET salary_pennies = 10000 WHERE salary_pennies IS NULL;
    END IF;
END $$;

-- Step 3: Create indexes for faster ranking queries
CREATE INDEX IF NOT EXISTS idx_golfers_world_rank ON golfers(world_rank) WHERE world_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_golfers_last_ranking_update ON golfers(last_ranking_update);
CREATE INDEX IF NOT EXISTS idx_golfers_salary ON golfers(salary_pennies);

-- Step 4: Create ranking history table
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

-- Step 5: Create indexes for history queries
CREATE INDEX IF NOT EXISTS idx_ranking_history_golfer ON golfer_ranking_history(golfer_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_history_recorded ON golfer_ranking_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_history_source ON golfer_ranking_history(source);

-- Step 6: Create ranking sync logs table
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

-- Step 7: Add documentation comments
COMMENT ON TABLE golfer_ranking_history IS 'Historical tracking of golfer rankings and salary changes';
COMMENT ON TABLE ranking_sync_logs IS 'Audit log of all ranking synchronization operations';
COMMENT ON COLUMN golfers.world_rank IS 'Current world ranking (lower is better, 1 = best)';
COMMENT ON COLUMN golfers.skill_rating IS 'DataGolf skill rating or similar metric (0-15 scale)';
COMMENT ON COLUMN golfers.salary_pennies IS 'Golfer salary in pennies (£1.00 = 100 pennies, so £150.00 = 15000)';
COMMENT ON COLUMN golfers.form_rating IS 'Recent form rating (0-100 scale)';

-- Verification query - run this to check it worked
SELECT 
  COUNT(*) as total_golfers,
  COUNT(world_rank) as golfers_with_rank,
  COUNT(salary_pennies) as golfers_with_salary,
  MIN(salary_pennies) as min_salary_pennies,
  MAX(salary_pennies) as max_salary_pennies,
  ROUND(AVG(salary_pennies)) as avg_salary_pennies
FROM golfers;

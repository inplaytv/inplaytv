-- ===================================================================
-- PREVENT DUPLICATE GOLFERS IN TOURNAMENTS
-- Add unique constraint to prevent future duplicates
-- ===================================================================

-- First, check if constraint already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tournament_golfers_tournament_golfer_unique'
  ) THEN
    -- Add unique constraint to prevent duplicate golfer entries per tournament
    ALTER TABLE tournament_golfers
    ADD CONSTRAINT tournament_golfers_tournament_golfer_unique 
    UNIQUE (tournament_id, golfer_id);
    
    RAISE NOTICE '✅ Added unique constraint: tournament_golfers_tournament_golfer_unique';
  ELSE
    RAISE NOTICE 'ℹ️  Unique constraint already exists';
  END IF;
END $$;

-- Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_tournament_golfer 
ON tournament_golfers(tournament_id, golfer_id);

-- Verify the constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'tournament_golfers'::regclass
  AND conname LIKE '%tournament%golfer%';

COMMENT ON CONSTRAINT tournament_golfers_tournament_golfer_unique ON tournament_golfers 
IS 'Prevents duplicate golfer entries in the same tournament';

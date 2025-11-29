-- ============================================================================
-- Add current_round column to tournaments table
-- ============================================================================
-- Purpose: Track which round (1-4) is currently active during a tournament
-- Used by: Scoring sync system to know which round to display/prioritize
-- ============================================================================

-- Add the column (nullable initially for existing records)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS current_round INTEGER;

-- Add check constraint to ensure valid round numbers (1-4 or NULL)
ALTER TABLE tournaments
ADD CONSTRAINT tournaments_current_round_check 
CHECK (current_round IS NULL OR (current_round >= 1 AND current_round <= 4));

-- Add comment for documentation
COMMENT ON COLUMN tournaments.current_round IS 
'Current active round number (1-4) during tournament. NULL if tournament not started or completed.';

-- Set default value for live tournaments (estimate based on dates)
-- This is a one-time update for existing records
UPDATE tournaments
SET current_round = CASE
    WHEN status = 'live' THEN 1  -- Default to round 1 for live tournaments
    WHEN status = 'completed' THEN 4  -- Completed tournaments finished round 4
    ELSE NULL  -- upcoming, draft, etc remain NULL
END
WHERE current_round IS NULL;

-- Verify the changes
SELECT 
    id,
    name,
    status,
    current_round,
    start_date,
    end_date
FROM tournaments
WHERE status IN ('live', 'completed')
ORDER BY start_date DESC
LIMIT 10;

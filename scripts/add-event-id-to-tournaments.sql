-- ============================================================================
-- Add event_id column to tournaments table for DataGolf integration
-- ============================================================================
-- Purpose: Store DataGolf event identifier for API lookups
-- Used by: Scoring sync system to fetch live scores from DataGolf
-- ============================================================================

-- Add the column
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Add unique constraint (each DataGolf event can only map to one tournament)
ALTER TABLE tournaments
ADD CONSTRAINT tournaments_event_id_unique UNIQUE (event_id);

-- Add comment for documentation
COMMENT ON COLUMN tournaments.event_id IS 
'DataGolf event identifier used for fetching live scores via their API';

-- Verify the changes
SELECT 
    id,
    name,
    status,
    event_id,
    start_date
FROM tournaments
ORDER BY start_date DESC
LIMIT 10;

-- ============================================================================
-- SETUP TOURNAMENT DATAGOLF INTEGRATION FIELDS
-- ============================================================================
-- Purpose: Add event_id and tour columns for automatic DataGolf integration
-- Run this migration to enable dynamic tournament mapping without code changes
-- ============================================================================

-- Step 1: Add tour column with supported values
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS tour TEXT 
CHECK (tour IN ('pga', 'euro', 'kft', 'alt', 'opp', 'lpga', 'other'));

-- Step 2: Add event_id column for DataGolf API
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Step 3: Set default tour for existing records (PGA Tour)
UPDATE tournaments 
SET tour = 'pga' 
WHERE tour IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN tournaments.tour IS 
'Golf tour identifier: pga (PGA Tour), euro (DP World/European Tour), kft (Korn Ferry), alt (LIV Golf), opp (Opposite Field), lpga (LPGA Tour), other';

COMMENT ON COLUMN tournaments.event_id IS 
'DataGolf event identifier (e.g., "australian-pga-championship-2025") used for fetching live scores via their API';

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_tour ON tournaments(tour);
CREATE INDEX IF NOT EXISTS idx_tournaments_event_id ON tournaments(event_id) WHERE event_id IS NOT NULL;

-- Step 6: Update BMW Australian PGA Championship with correct values
UPDATE tournaments 
SET 
    tour = 'euro',
    event_id = 'australian-pga-championship-2025'
WHERE name LIKE '%BMW Australian PGA%' 
   OR slug LIKE '%bmw-australian-pga%';

-- Step 7: Update RSM Classic with correct values
UPDATE tournaments 
SET 
    tour = 'pga',
    event_id = 'rsm-classic-2025'
WHERE name LIKE '%RSM Classic%' 
   OR slug LIKE '%rsm-classic%';

-- Step 8: Verify the changes
SELECT 
    name,
    tour,
    event_id,
    status,
    start_date,
    end_date
FROM tournaments
WHERE tour IS NOT NULL OR event_id IS NOT NULL
ORDER BY start_date DESC;

-- Step 9: Show summary by tour
SELECT 
    tour,
    COUNT(*) as tournament_count,
    COUNT(event_id) as has_event_id,
    COUNT(CASE WHEN status = 'live' THEN 1 END) as live_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM tournaments
GROUP BY tour
ORDER BY tour;


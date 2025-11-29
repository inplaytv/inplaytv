-- ============================================================================
-- ADD TOUR COLUMN TO TOURNAMENTS TABLE
-- ============================================================================
-- Purpose: Enable multi-tour support for DataGolf field sync
-- Supports: PGA Tour, European Tour (DP World), Korn Ferry, LIV Golf, etc.
-- ============================================================================

-- Step 1: Add tour column with supported values
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS tour TEXT 
CHECK (tour IN ('pga', 'euro', 'kft', 'alt', 'opp', 'lpga', 'other'));

-- Step 2: Add default value for existing records (PGA Tour)
UPDATE tournaments 
SET tour = 'pga' 
WHERE tour IS NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN tournaments.tour IS 
'Golf tour identifier: pga (PGA Tour), euro (DP World/European Tour), kft (Korn Ferry), alt (LIV Golf), opp (Opposite Field), lpga (LPGA Tour), other';

-- Step 4: Create index for filtering by tour
CREATE INDEX IF NOT EXISTS idx_tournaments_tour ON tournaments(tour);

-- Step 5: Verify the changes
SELECT 
    id,
    name,
    tour,
    status,
    start_date
FROM tournaments
ORDER BY start_date DESC
LIMIT 10;

-- Step 6: Show summary by tour
SELECT 
    tour,
    COUNT(*) as tournament_count,
    COUNT(CASE WHEN status = 'upcoming' THEN 1 END) as upcoming_count
FROM tournaments
GROUP BY tour
ORDER BY tour;

-- ============================================================================
-- UPDATE EUROPEAN TOUR TOURNAMENTS
-- ============================================================================
-- Run this after add-tour-to-tournaments.sql to set correct tour types
-- ============================================================================

-- Update European Tour (DP World Tour) events
UPDATE tournaments SET tour = 'euro' 
WHERE name LIKE '%BMW Australian PGA%'
   OR name LIKE '%Australian Open%'
   OR name LIKE '%Australian PGA%'
   OR name LIKE '%Nedbank%'
   OR name LIKE '%DP World%'
   OR name LIKE '%European%';

-- Verify European Tour updates
SELECT 
    id,
    name,
    tour,
    status,
    start_date
FROM tournaments
WHERE tour = 'euro'
ORDER BY start_date DESC;

-- Show final summary
SELECT 
    tour,
    COUNT(*) as count,
    string_agg(name, ', ' ORDER BY start_date DESC) as tournaments
FROM tournaments
GROUP BY tour
ORDER BY tour;

-- ============================================================================
-- MANUAL WORKAROUND: Add BMW Australian PGA Golfers
-- ============================================================================
-- Since field-updates might not return the field for this event,
-- we can use live-tournament-stats to get the current field
-- ============================================================================

-- First, let's check what we have
SELECT 
    id as tournament_id,
    name,
    tour,
    start_date,
    end_date
FROM tournaments
WHERE name LIKE '%BMW Australian PGA%';

-- Check current golfers (should be 0)
SELECT COUNT(*) as current_golfer_count
FROM tournament_golfers
WHERE tournament_id = (
    SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
);

-- ============================================================================
-- ALTERNATIVE: Use a different DataGolf endpoint
-- ============================================================================
-- The live-tournament-stats endpoint returns ALL players in the current event
-- Endpoint: https://feeds.datagolf.com/preds/live-tournament-stats?tour=euro
-- This will give us the full field with their current scores
-- ============================================================================

-- NOTE: You'll need to fetch this data and we can create golfers from it
-- The sync endpoint should be updated to try multiple DataGolf endpoints

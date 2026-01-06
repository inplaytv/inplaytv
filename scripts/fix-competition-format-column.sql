-- FIX: Add competition_format column and populate it
-- This is required for the Unified Competition System
-- Reference: ARCHITECTURE-BOUNDARIES.md

-- Step 1: Add column if it doesn't exist
ALTER TABLE tournament_competitions 
ADD COLUMN IF NOT EXISTS competition_format TEXT;

-- Step 2: Set format based on existing data
-- InPlay competitions: Have competition_type_id (NOT NULL)
-- ONE 2 ONE competitions: Have template_id (NOT NULL) and rounds_covered

UPDATE tournament_competitions
SET competition_format = CASE
    WHEN competition_type_id IS NOT NULL THEN 'inplay'
    WHEN template_id IS NOT NULL AND rounds_covered IS NOT NULL THEN 'one2one'
    ELSE 'inplay'  -- Default to inplay for legacy admin-created competitions
END
WHERE competition_format IS NULL;

-- Step 3: Add constraint to ensure valid values
ALTER TABLE tournament_competitions
ADD CONSTRAINT check_competition_format 
CHECK (competition_format IN ('inplay', 'one2one'));

-- Step 4: Verify the fix
SELECT 
    competition_format,
    COUNT(*) as count,
    STRING_AGG(DISTINCT status, ', ') as statuses
FROM tournament_competitions
GROUP BY competition_format;

-- Step 5: Show sample records
SELECT 
    id,
    competition_format,
    competition_type_id,
    template_id,
    status,
    current_players,
    max_players
FROM tournament_competitions
LIMIT 10;

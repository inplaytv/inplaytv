-- CRITICAL FIX: Prevent ONE 2 ONE instances in tournament_competitions table
-- 
-- This adds database constraints to ensure:
-- 1. tournament_competitions ALWAYS has a valid competition_type_id (InPlay competitions)
-- 2. tournament_competitions NEVER has rounds_covered (that's for ONE 2 ONE only)
-- 3. competition_instances NEVER has competition_type_id (that's for InPlay only)

-- First, clean up any existing invalid data
DELETE FROM tournament_competitions 
WHERE competition_type_id IS NULL OR rounds_covered IS NOT NULL;

-- Add NOT NULL constraint to competition_type_id in tournament_competitions
ALTER TABLE tournament_competitions 
ALTER COLUMN competition_type_id SET NOT NULL;

-- Add check constraint to ensure rounds_covered is always NULL in tournament_competitions
ALTER TABLE tournament_competitions
ADD CONSTRAINT tournament_competitions_no_rounds_covered 
CHECK (rounds_covered IS NULL);

-- Add check constraint to ensure competition_instances never has competition_type_id
ALTER TABLE competition_instances
ADD CONSTRAINT competition_instances_no_competition_type 
CHECK (competition_type_id IS NULL);

-- Add check constraint to ensure competition_instances always has rounds_covered
ALTER TABLE competition_instances
ALTER COLUMN rounds_covered SET NOT NULL;

-- Success message
SELECT 
  '✅ Database constraints added successfully!' as message,
  'tournament_competitions can only have InPlay competitions (competition_type_id required)' as rule_1,
  'competition_instances can only have ONE 2 ONE challenges (rounds_covered required)' as rule_2,
  'These tables are now completely separated at the database level' as rule_3;

-- Update the tour check constraint to allow 'european' (from DataGolf API)
-- Current constraint only allows: 'pga', 'euro', 'kft', 'alt', 'opp', 'lpga', 'other'
-- Need to add 'european' as DataGolf returns this value

-- Drop the old constraint
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_tour_check;

-- Add the updated constraint with 'european' included
ALTER TABLE tournaments ADD CONSTRAINT tournaments_tour_check 
CHECK (tour IN ('pga', 'euro', 'european', 'kft', 'alt', 'opp', 'lpga', 'other'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'tournaments_tour_check';

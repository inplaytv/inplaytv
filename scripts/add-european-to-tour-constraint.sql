-- Add 'european' to the tour check constraint
-- The DataGolf API returns 'European' which gets lowercased to 'european'
-- But the constraint only allows 'euro'

ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_tour_check;

ALTER TABLE tournaments ADD CONSTRAINT tournaments_tour_check 
CHECK (tour IN ('pga', 'euro', 'european', 'kft', 'alt', 'opp', 'lpga', 'other'));

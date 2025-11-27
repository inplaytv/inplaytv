-- Add first_prize_percent column to tournament_competitions table
-- This stores the percentage of prize pool that goes to 1st place

ALTER TABLE public.tournament_competitions 
ADD COLUMN IF NOT EXISTS first_prize_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00 
CHECK (first_prize_percent >= 0 AND first_prize_percent <= 100);

-- Update existing competitions to have 20% for 1st place (typical structure)
UPDATE public.tournament_competitions 
SET first_prize_percent = 20.00 
WHERE first_prize_percent IS NULL;

COMMENT ON COLUMN public.tournament_competitions.first_prize_percent IS 'Percentage of prize pool (after admin fee) awarded to 1st place winner';

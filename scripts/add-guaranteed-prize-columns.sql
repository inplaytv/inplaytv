-- Add guaranteed prize pool columns to tournament_competitions table
-- Run this in your Supabase SQL editor

ALTER TABLE tournament_competitions 
ADD COLUMN IF NOT EXISTS guaranteed_prize_pool_pennies INTEGER,
ADD COLUMN IF NOT EXISTS first_place_prize_pennies INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN tournament_competitions.guaranteed_prize_pool_pennies IS 'Optional override for guaranteed prize pool in pennies. If NULL, auto-calculate from entry_fee * entrants_cap * (1 - admin_fee%)';
COMMENT ON COLUMN tournament_competitions.first_place_prize_pennies IS 'Optional override for first place prize in pennies. If NULL, auto-calculate as 25% of prize pool';

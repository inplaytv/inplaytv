-- ===================================================================
-- ADD ADMIN FEE PERCENT TO TOURNAMENT COMPETITIONS
-- Run this in Supabase Dashboard SQL Editor
-- This adds the admin_fee_percent column if it doesn't exist
-- ===================================================================

-- Add admin_fee_percent column to tournament_competitions
DO $$ 
BEGIN
  -- Check if column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tournament_competitions' 
      AND column_name = 'admin_fee_percent'
  ) THEN
    ALTER TABLE public.tournament_competitions 
    ADD COLUMN admin_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00 
    CHECK (admin_fee_percent >= 0 AND admin_fee_percent <= 100);
    
    RAISE NOTICE 'Column admin_fee_percent added successfully';
  ELSE
    RAISE NOTICE 'Column admin_fee_percent already exists';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.tournament_competitions.admin_fee_percent IS 'Platform admin fee percentage (0-100). Can be customized per competition. Defaults to 10%.';

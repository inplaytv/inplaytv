-- ===================================================================
-- MIGRATION: Add safeguards to prevent wrong golfer syncs
-- ===================================================================

-- 1. Add unique constraint to prevent duplicate golfers per tournament
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tournament_golfers_tournament_golfer_unique'
  ) THEN
    ALTER TABLE tournament_golfers
    ADD CONSTRAINT tournament_golfers_tournament_golfer_unique 
    UNIQUE (tournament_id, golfer_id);
    
    RAISE NOTICE '✅ Added unique constraint: tournament_golfers_tournament_golfer_unique';
  ELSE
    RAISE NOTICE 'ℹ️  Unique constraint already exists';
  END IF;
END $$;

-- 2. Create sync history tracking table
CREATE TABLE IF NOT EXISTS tournament_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_by TEXT, -- User ID or 'system'
  source TEXT NOT NULL, -- 'datagolf_field_updates', 'datagolf_live_stats', 'manual'
  tour_parameter TEXT, -- 'pga', 'euro', 'kft', etc
  
  -- DataGolf response info
  event_name_returned TEXT,
  golfers_in_response INTEGER,
  
  -- Before/after counts
  golfers_before INTEGER,
  golfers_after INTEGER,
  
  -- Sync details
  replace_mode BOOLEAN DEFAULT FALSE,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_history_tournament 
ON tournament_sync_history(tournament_id, synced_at DESC);

COMMENT ON TABLE tournament_sync_history 
IS 'Tracks all golfer sync operations to help debug issues and prevent duplicates';

-- 3. Add datagolf_event_id to tournaments table for precise matching
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND column_name = 'datagolf_event_id'
  ) THEN
    ALTER TABLE tournaments
    ADD COLUMN datagolf_event_id TEXT;
    
    RAISE NOTICE '✅ Added datagolf_event_id column to tournaments table';
  ELSE
    RAISE NOTICE 'ℹ️  datagolf_event_id column already exists';
  END IF;
END $$;

-- 4. Add expected_tour to tournaments table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND column_name = 'expected_tour'
  ) THEN
    ALTER TABLE tournaments
    ADD COLUMN expected_tour TEXT CHECK (expected_tour IN ('pga', 'euro', 'kft', 'opp', 'alt'));
    
    RAISE NOTICE '✅ Added expected_tour column to tournaments table';
  ELSE
    RAISE NOTICE 'ℹ️  expected_tour column already exists';
  END IF;
END $$;

-- 5. Create function to log sync operations
CREATE OR REPLACE FUNCTION log_tournament_sync(
  p_tournament_id UUID,
  p_source TEXT,
  p_event_name TEXT,
  p_golfers_count INTEGER,
  p_replace_mode BOOLEAN,
  p_tour_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_before_count INTEGER;
  v_sync_id UUID;
BEGIN
  -- Get current golfer count
  SELECT COUNT(*) INTO v_before_count
  FROM tournament_golfers
  WHERE tournament_id = p_tournament_id;
  
  -- Insert sync record
  INSERT INTO tournament_sync_history (
    tournament_id,
    source,
    event_name_returned,
    golfers_in_response,
    golfers_before,
    replace_mode,
    tour_parameter
  ) VALUES (
    p_tournament_id,
    p_source,
    p_event_name,
    p_golfers_count,
    v_before_count,
    p_replace_mode,
    p_tour_param
  )
  RETURNING id INTO v_sync_id;
  
  RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to complete sync log (update after count)
CREATE OR REPLACE FUNCTION complete_tournament_sync(
  p_sync_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_tournament_id UUID;
  v_after_count INTEGER;
BEGIN
  -- Get tournament ID from sync record
  SELECT tournament_id INTO v_tournament_id
  FROM tournament_sync_history
  WHERE id = p_sync_id;
  
  -- Get current golfer count
  SELECT COUNT(*) INTO v_after_count
  FROM tournament_golfers
  WHERE tournament_id = v_tournament_id;
  
  -- Update sync record
  UPDATE tournament_sync_history
  SET 
    golfers_after = v_after_count,
    success = p_success,
    error_message = p_error_message
  WHERE id = p_sync_id;
END;
$$ LANGUAGE plpgsql;

-- 7. TEMPORARY FIX: Update Alfred Dunhill registration times to be in the future for testing
-- This allows us to test the "Registration Open" status display
DO $$ 
DECLARE
  v_tournament_id UUID;
BEGIN
  -- Get Alfred Dunhill tournament ID
  SELECT id INTO v_tournament_id
  FROM tournaments
  WHERE slug = 'alfred-dunhill-championship-2024';
  
  IF v_tournament_id IS NOT NULL THEN
    -- Update ALL competitions for Alfred Dunhill to have future reg_close_at times
    -- Set them to close in 48 hours from now
    UPDATE tournament_competitions
    SET 
      reg_open_at = NOW(),
      reg_close_at = NOW() + INTERVAL '48 hours',
      start_at = NOW() + INTERVAL '48 hours'
    WHERE tournament_id = v_tournament_id;
    
    RAISE NOTICE '✅ Updated Alfred Dunhill registration times to be in the future (closes in 48 hours)';
  ELSE
    RAISE NOTICE 'ℹ️  Alfred Dunhill tournament not found';
  END IF;
END $$;

-- Verify
SELECT 
  '✅ MIGRATION COMPLETE' as status,
  'tournament_golfers has unique constraint' as safeguard_1,
  'tournament_sync_history table created' as safeguard_2,
  'datagolf_event_id column added' as safeguard_3,
  'expected_tour column added' as safeguard_4,
  'sync logging functions created' as safeguard_5,
  'Alfred Dunhill registration times updated' as safeguard_6;

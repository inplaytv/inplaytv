-- FINAL COMPREHENSIVE CLEANUP: Remove all references to old column names
-- This fixes the constant errors and confusion from legacy field names

-- ============================================================================
-- STEP 1: Drop old duplicate columns from tournaments table
-- ============================================================================
ALTER TABLE tournaments 
  DROP COLUMN IF EXISTS round1_tee_time,
  DROP COLUMN IF EXISTS round2_tee_time,
  DROP COLUMN IF EXISTS round3_tee_time,
  DROP COLUMN IF EXISTS round4_tee_time;

-- ============================================================================
-- STEP 2: Drop the RPC function that references old columns
-- ============================================================================
DROP FUNCTION IF EXISTS detect_tournament_status_mismatches();

-- Recreate it with correct column names (simplified approach)
CREATE OR REPLACE FUNCTION detect_tournament_status_mismatches()
RETURNS TABLE (
  tournament_id UUID,
  tournament_name TEXT,
  current_status TEXT,
  suggested_status TEXT,
  reason TEXT
) AS $$
DECLARE
  rec RECORD;
  v_suggested_status TEXT;
  v_reason TEXT;
BEGIN
  FOR rec IN 
    SELECT id, name, status, start_date, end_date, registration_opens_at, registration_closes_at
    FROM tournaments
    WHERE status != 'draft' AND status != 'cancelled'
  LOOP
    v_suggested_status := NULL;
    v_reason := NULL;
    
    -- Check if should be 'upcoming'
    IF rec.start_date > NOW() 
       AND (rec.registration_opens_at IS NULL OR rec.registration_opens_at > NOW())
       AND rec.status != 'upcoming'
    THEN
      v_suggested_status := 'upcoming';
      v_reason := 'Tournament starts ' || rec.start_date::TEXT || ' but status is ' || rec.status;
    
    -- Check if should be 'registration_open'
    ELSIF rec.registration_opens_at <= NOW() 
       AND rec.registration_closes_at > NOW()
       AND rec.status != 'registration_open'
    THEN
      v_suggested_status := 'registration_open';
      v_reason := 'Registration window is currently open';
    
    -- Check if should be 'in_progress'
    ELSIF rec.start_date <= NOW() 
       AND rec.end_date >= NOW()
       AND rec.status != 'in_progress'
    THEN
      v_suggested_status := 'in_progress';
      v_reason := 'Tournament is currently running';
    
    -- Check if should be 'completed'
    ELSIF rec.end_date < NOW()
       AND rec.status != 'completed'
    THEN
      v_suggested_status := 'completed';
      v_reason := 'Tournament ended on ' || rec.end_date::TEXT;
    END IF;
    
    -- Return row if there's a mismatch
    IF v_suggested_status IS NOT NULL THEN
      tournament_id := rec.id;
      tournament_name := rec.name;
      current_status := rec.status;
      suggested_status := v_suggested_status;
      reason := v_reason;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Test the fixed function
SELECT * FROM detect_tournament_status_mismatches();

-- Verify no old columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
  AND column_name IN ('registration_open_date', 'registration_close_date', 'round1_tee_time', 'round2_tee_time', 'round3_tee_time', 'round4_tee_time');
-- Should return 0 rows

-- Show current correct columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
  AND column_name LIKE '%registration%' OR column_name LIKE '%round%'
ORDER BY column_name;

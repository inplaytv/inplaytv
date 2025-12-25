-- ========================================
-- CLEANUP: Simplify Tournament Architecture
-- Remove all duplicate status and timing fields
-- ========================================

-- STEP 1: Remove competition-level status (inherit from tournament)
-- Keep it in DB for now but stop using it in UI
COMMENT ON COLUMN tournament_competitions.status IS 'DEPRECATED - Use tournament.status instead';

-- STEP 2: Remove duplicate registration date fields
-- Keep only lifecycle fields: registration_opens_at, registration_closes_at, round_X_start
ALTER TABLE tournaments DROP COLUMN IF EXISTS registration_open_date CASCADE;
ALTER TABLE tournaments DROP COLUMN IF EXISTS registration_close_date CASCADE;

-- STEP 3: Document the single source of truth
COMMENT ON COLUMN tournaments.registration_opens_at IS 'SOURCE OF TRUTH - When registration opens for ALL competitions';
COMMENT ON COLUMN tournaments.registration_closes_at IS 'SOURCE OF TRUTH - When registration closes (competitions inherit this)';
COMMENT ON COLUMN tournaments.round_1_start IS 'SOURCE OF TRUTH - Round 1 tee time';
COMMENT ON COLUMN tournaments.round_2_start IS 'SOURCE OF TRUTH - Round 2 tee time';
COMMENT ON COLUMN tournaments.round_3_start IS 'SOURCE OF TRUTH - Round 3 tee time';
COMMENT ON COLUMN tournaments.round_4_start IS 'SOURCE OF TRUTH - Round 4 tee time';
COMMENT ON COLUMN tournaments.status IS 'SOURCE OF TRUTH - Tournament status (upcoming/registration_open/live/completed)';

-- STEP 4: Auto-sync function - competitions inherit from tournament
CREATE OR REPLACE FUNCTION sync_competition_from_tournament()
RETURNS TRIGGER AS $$
BEGIN
  -- When tournament timing changes, update all competitions
  UPDATE tournament_competitions
  SET 
    reg_open_at = NEW.registration_opens_at,
    reg_close_at = CASE 
      WHEN start_at IS NOT NULL THEN (start_at::timestamp - interval '15 minutes')
      ELSE NEW.registration_closes_at
    END,
    status = CASE NEW.status
      WHEN 'registration_open' THEN 'reg_open'
      WHEN 'in_progress' THEN 'live'
      WHEN 'registration_closed' THEN 'reg_closed'
      ELSE NEW.status
    END,
    updated_at = NOW()
  WHERE tournament_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_competitions_on_tournament_update ON tournaments;
CREATE TRIGGER sync_competitions_on_tournament_update
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  WHEN (
    OLD.registration_opens_at IS DISTINCT FROM NEW.registration_opens_at OR
    OLD.registration_closes_at IS DISTINCT FROM NEW.registration_closes_at OR
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.round_1_start IS DISTINCT FROM NEW.round_1_start OR
    OLD.round_2_start IS DISTINCT FROM NEW.round_2_start OR
    OLD.round_3_start IS DISTINCT FROM NEW.round_3_start OR
    OLD.round_4_start IS DISTINCT FROM NEW.round_4_start
  )
  EXECUTE FUNCTION sync_competition_from_tournament();

-- STEP 5: Sync existing competitions NOW with proper status mapping
UPDATE tournament_competitions tc
SET 
  reg_open_at = t.registration_opens_at,
  reg_close_at = CASE 
    WHEN tc.start_at IS NOT NULL THEN (tc.start_at::timestamp - interval '15 minutes')
    ELSE t.registration_closes_at
  END,
  status = CASE t.status
    WHEN 'registration_open' THEN 'reg_open'
    WHEN 'in_progress' THEN 'live'
    WHEN 'registration_closed' THEN 'reg_closed'
    ELSE t.status
  END,
  updated_at = NOW()
FROM tournaments t
WHERE tc.tournament_id = t.id;

-- Done! Now:
-- - Tournaments have ONE status
-- - Tournaments have ONE set of timing fields
-- - Competitions inherit automatically

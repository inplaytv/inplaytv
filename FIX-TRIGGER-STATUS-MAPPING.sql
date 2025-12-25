-- Fix the trigger to properly map ALL tournament statuses to competition statuses
-- This prevents the "violates check constraint" error

DROP TRIGGER IF EXISTS sync_competitions_on_tournament_update ON tournaments;
DROP FUNCTION IF EXISTS sync_competition_from_tournament();

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
    -- Map tournament status to competition status
    -- Competition valid statuses: draft, upcoming, reg_open, reg_closed, live, completed, cancelled
    status = CASE 
      WHEN NEW.status = 'registration_open' THEN 'reg_open'
      WHEN NEW.status = 'in_progress' THEN 'live'
      WHEN NEW.status = 'registration_closed' THEN 'reg_closed'
      WHEN NEW.status = 'draft' THEN 'draft'
      WHEN NEW.status = 'upcoming' THEN 'upcoming'
      WHEN NEW.status = 'completed' THEN 'completed'
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      -- Default: don't change status if tournament has unknown status
      ELSE status
    END,
    updated_at = NOW()
  WHERE tournament_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
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

-- Test: Show current competition statuses
SELECT id, status, reg_open_at, reg_close_at 
FROM tournament_competitions 
LIMIT 5;

-- Create function to sync competition times from tournament lifecycle
-- This ensures competitions always get correct reg_open_at, reg_close_at based on tournament settings

CREATE OR REPLACE FUNCTION sync_competition_from_tournament()
RETURNS TRIGGER AS $$
DECLARE
  v_round4_tee_time timestamptz;
  v_round3_tee_time timestamptz;
  v_round2_tee_time timestamptz;
  v_round1_tee_time timestamptz;
  v_reg_opens_at timestamptz;
  v_start_at timestamptz;
  v_reg_close_at timestamptz;
BEGIN
  -- Get tournament timing info
  SELECT 
    registration_opens_at,
    round_1_start,
    round_2_start,
    round_3_start,
    round_4_start
  INTO 
    v_reg_opens_at,
    v_round1_tee_time,
    v_round2_tee_time,
    v_round3_tee_time,
    v_round4_tee_time
  FROM tournaments
  WHERE id = NEW.tournament_id;

  -- Auto-set reg_open_at from tournament if not explicitly provided
  IF NEW.reg_open_at IS NULL THEN
    NEW.reg_open_at := v_reg_opens_at;
  END IF;

  -- Determine start_at based on competition type rounds covered
  -- Get the round info from competition_types if we don't have start_at
  IF NEW.start_at IS NULL THEN
    DECLARE
      v_rounds_covered integer[];
      v_first_round integer;
    BEGIN
      -- Get rounds_covered from competition type
      SELECT rounds_covered INTO v_rounds_covered
      FROM competition_types
      WHERE id = NEW.competition_type_id;

      IF v_rounds_covered IS NOT NULL AND array_length(v_rounds_covered, 1) > 0 THEN
        -- Use the first round in the coverage
        v_first_round := v_rounds_covered[1];
        
        -- Set start_at based on which round
        CASE v_first_round
          WHEN 1 THEN v_start_at := v_round1_tee_time;
          WHEN 2 THEN v_start_at := v_round2_tee_time;
          WHEN 3 THEN v_start_at := v_round3_tee_time;
          WHEN 4 THEN v_start_at := v_round4_tee_time;
        END CASE;
        
        IF v_start_at IS NOT NULL THEN
          NEW.start_at := v_start_at;
        END IF;
      END IF;
    END;
  END IF;

  -- Auto-calculate reg_close_at as 15 minutes before start_at
  IF NEW.start_at IS NOT NULL THEN
    NEW.reg_close_at := NEW.start_at - INTERVAL '15 minutes';
  ELSIF NEW.reg_close_at IS NULL THEN
    -- Fallback to tournament registration close
    SELECT registration_closes_at INTO v_reg_close_at
    FROM tournaments
    WHERE id = NEW.tournament_id;
    
    NEW.reg_close_at := v_reg_close_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_competition_times_on_insert ON tournament_competitions;
DROP TRIGGER IF EXISTS sync_competition_times_on_update ON tournament_competitions;

-- Create trigger for INSERT
CREATE TRIGGER sync_competition_times_on_insert
  BEFORE INSERT ON tournament_competitions
  FOR EACH ROW
  EXECUTE FUNCTION sync_competition_from_tournament();

-- Create trigger for UPDATE
CREATE TRIGGER sync_competition_times_on_update
  BEFORE UPDATE ON tournament_competitions
  FOR EACH ROW
  WHEN (
    OLD.tournament_id IS DISTINCT FROM NEW.tournament_id OR
    OLD.competition_type_id IS DISTINCT FROM NEW.competition_type_id OR
    OLD.start_at IS DISTINCT FROM NEW.start_at
  )
  EXECUTE FUNCTION sync_competition_from_tournament();

-- Also create trigger to update competitions when tournament lifecycle changes
CREATE OR REPLACE FUNCTION update_competitions_on_tournament_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When tournament round tee times or registration times change,
  -- update all competitions that don't have manually set times
  UPDATE tournament_competitions tc
  SET 
    reg_open_at = COALESCE(tc.reg_open_at, NEW.registration_opens_at),
    start_at = CASE 
      WHEN EXISTS (
        SELECT 1 FROM competition_types ct 
        WHERE ct.id = tc.competition_type_id 
        AND ct.rounds_covered IS NOT NULL 
        AND 1 = ANY(ct.rounds_covered)
      ) THEN NEW.round_1_start
      WHEN EXISTS (
        SELECT 1 FROM competition_types ct 
        WHERE ct.id = tc.competition_type_id 
        AND ct.rounds_covered IS NOT NULL 
        AND 2 = ANY(ct.rounds_covered)
      ) THEN NEW.round_2_start
      WHEN EXISTS (
        SELECT 1 FROM competition_types ct 
        WHERE ct.id = tc.competition_type_id 
        AND ct.rounds_covered IS NOT NULL 
        AND 3 = ANY(ct.rounds_covered)
      ) THEN NEW.round_3_start
      WHEN EXISTS (
        SELECT 1 FROM competition_types ct 
        WHERE ct.id = tc.competition_type_id 
        AND ct.rounds_covered IS NOT NULL 
        AND 4 = ANY(ct.rounds_covered)
      ) THEN NEW.round_4_start
      ELSE tc.start_at
    END,
    reg_close_at = CASE
      WHEN NEW.round_1_start IS NOT NULL OR NEW.round_2_start IS NOT NULL 
           OR NEW.round_3_start IS NOT NULL OR NEW.round_4_start IS NOT NULL
      THEN (
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM competition_types ct 
            WHERE ct.id = tc.competition_type_id 
            AND ct.rounds_covered IS NOT NULL 
            AND 1 = ANY(ct.rounds_covered)
          ) THEN NEW.round_1_start - INTERVAL '15 minutes'
          WHEN EXISTS (
            SELECT 1 FROM competition_types ct 
            WHERE ct.id = tc.competition_type_id 
            AND ct.rounds_covered IS NOT NULL 
            AND 2 = ANY(ct.rounds_covered)
          ) THEN NEW.round_2_start - INTERVAL '15 minutes'
          WHEN EXISTS (
            SELECT 1 FROM competition_types ct 
            WHERE ct.id = tc.competition_type_id 
            AND ct.rounds_covered IS NOT NULL 
            AND 3 = ANY(ct.rounds_covered)
          ) THEN NEW.round_3_start - INTERVAL '15 minutes'
          WHEN EXISTS (
            SELECT 1 FROM competition_types ct 
            WHERE ct.id = tc.competition_type_id 
            AND ct.rounds_covered IS NOT NULL 
            AND 4 = ANY(ct.rounds_covered)
          ) THEN NEW.round_4_start - INTERVAL '15 minutes'
          ELSE tc.reg_close_at
        END
      )
      ELSE tc.reg_close_at
    END
  WHERE tc.tournament_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_competitions_on_tournament_lifecycle ON tournaments;

CREATE TRIGGER update_competitions_on_tournament_lifecycle
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  WHEN (
    OLD.registration_opens_at IS DISTINCT FROM NEW.registration_opens_at OR
    OLD.round_1_start IS DISTINCT FROM NEW.round_1_start OR
    OLD.round_2_start IS DISTINCT FROM NEW.round_2_start OR
    OLD.round_3_start IS DISTINCT FROM NEW.round_3_start OR
    OLD.round_4_start IS DISTINCT FROM NEW.round_4_start
  )
  EXECUTE FUNCTION update_competitions_on_tournament_change();

COMMENT ON FUNCTION sync_competition_from_tournament() IS 
  'Auto-populates competition timing from tournament lifecycle manager. Sets reg_open_at from tournament, calculates reg_close_at as start_at - 15min, and determines start_at from appropriate round tee time based on competition type rounds_covered.';

COMMENT ON FUNCTION update_competitions_on_tournament_change() IS 
  'Cascades tournament timing changes to all competitions. When round tee times or registration windows change in lifecycle manager, all competitions automatically update their times.';

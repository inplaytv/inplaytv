-- 🚨 CRITICAL: Database-level constraints for competition format integrity
-- Run this in Supabase SQL Editor to prevent format mixing at database level

-- ============================================================================
-- STEP 1: Set competition_format for any existing records that are missing it
-- ============================================================================

-- Set 'inplay' for records with competition_type_id (InPlay competitions)
UPDATE tournament_competitions
SET competition_format = 'inplay'
WHERE competition_type_id IS NOT NULL
  AND (competition_format IS NULL OR competition_format = '');

-- Set 'one2one' for records with rounds_covered (ONE 2 ONE challenges)
UPDATE tournament_competitions
SET competition_format = 'one2one'
WHERE competition_type_id IS NULL
  AND rounds_covered IS NOT NULL
  AND (competition_format IS NULL OR competition_format = '');

-- ============================================================================
-- STEP 2: Make competition_format NOT NULL
-- ============================================================================

ALTER TABLE tournament_competitions
ALTER COLUMN competition_format SET NOT NULL;

-- ============================================================================
-- STEP 3: Add CHECK constraints to enforce format rules
-- ============================================================================

-- Constraint 1: InPlay competitions MUST have competition_type_id
ALTER TABLE tournament_competitions
DROP CONSTRAINT IF EXISTS inplay_must_have_type;
ALTER TABLE tournament_competitions
ADD CONSTRAINT inplay_must_have_type
CHECK (
  competition_format != 'inplay' OR 
  competition_type_id IS NOT NULL
);

-- Constraint 2: ONE 2 ONE challenges MUST NOT have competition_type_id
ALTER TABLE tournament_competitions
DROP CONSTRAINT IF EXISTS one2one_must_not_have_type;
ALTER TABLE tournament_competitions
ADD CONSTRAINT one2one_must_not_have_type
CHECK (
  competition_format != 'one2one' OR 
  competition_type_id IS NULL
);

-- Constraint 3: ONE 2 ONE challenges MUST have rounds_covered
ALTER TABLE tournament_competitions
DROP CONSTRAINT IF EXISTS one2one_must_have_rounds;
ALTER TABLE tournament_competitions
ADD CONSTRAINT one2one_must_have_rounds
CHECK (
  competition_format != 'one2one' OR 
  rounds_covered IS NOT NULL
);

-- Constraint 4: competition_format must be valid value
ALTER TABLE tournament_competitions
DROP CONSTRAINT IF EXISTS valid_competition_format;
ALTER TABLE tournament_competitions
ADD CONSTRAINT valid_competition_format
CHECK (
  competition_format IN ('inplay', 'one2one')
);

-- ============================================================================
-- STEP 4: Add trigger to prevent ONE 2 ONE deletion with entries
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_one2one_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check ONE 2 ONE challenges
  IF OLD.competition_format = 'one2one' THEN
    -- Check if has entries that were paid for
    IF EXISTS (
      SELECT 1 FROM competition_entries 
      WHERE competition_id = OLD.id
        AND entry_fee_paid > 0
    ) THEN
      RAISE EXCEPTION 'Cannot delete ONE 2 ONE challenge ID % - has paid entries. Refund users first.', OLD.id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_one2one_deletion ON tournament_competitions;
CREATE TRIGGER check_one2one_deletion
  BEFORE DELETE ON tournament_competitions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_one2one_deletion();

-- ============================================================================
-- STEP 5: Add trigger to validate format on INSERT/UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_competition_format()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate InPlay format
  IF NEW.competition_format = 'inplay' THEN
    IF NEW.competition_type_id IS NULL THEN
      RAISE EXCEPTION 'InPlay competition must have competition_type_id set';
    END IF;
  END IF;
  
  -- Validate ONE 2 ONE format
  IF NEW.competition_format = 'one2one' THEN
    IF NEW.competition_type_id IS NOT NULL THEN
      RAISE EXCEPTION 'ONE 2 ONE challenge cannot have competition_type_id';
    END IF;
    IF NEW.rounds_covered IS NULL THEN
      RAISE EXCEPTION 'ONE 2 ONE challenge must have rounds_covered set';
    END IF;
    IF NEW.max_players != 2 THEN
      RAISE EXCEPTION 'ONE 2 ONE challenge must have max_players = 2';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_format_on_insert_update ON tournament_competitions;
CREATE TRIGGER validate_format_on_insert_update
  BEFORE INSERT OR UPDATE ON tournament_competitions
  FOR EACH ROW
  EXECUTE FUNCTION validate_competition_format();

-- ============================================================================
-- VERIFICATION: Check all records have correct format
-- ============================================================================

-- This should return 0 rows (all InPlay should have type_id)
SELECT id, competition_format, competition_type_id 
FROM tournament_competitions
WHERE competition_format = 'inplay' 
  AND competition_type_id IS NULL;

-- This should return 0 rows (all ONE 2 ONE should NOT have type_id)
SELECT id, competition_format, competition_type_id 
FROM tournament_competitions
WHERE competition_format = 'one2one' 
  AND competition_type_id IS NOT NULL;

-- This should return 0 rows (all ONE 2 ONE should have rounds)
SELECT id, competition_format, rounds_covered 
FROM tournament_competitions
WHERE competition_format = 'one2one' 
  AND rounds_covered IS NULL;

-- Summary report
SELECT 
  competition_format,
  COUNT(*) as count,
  COUNT(CASE WHEN competition_type_id IS NOT NULL THEN 1 END) as with_type_id,
  COUNT(CASE WHEN rounds_covered IS NOT NULL THEN 1 END) as with_rounds
FROM tournament_competitions
GROUP BY competition_format;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Competition format constraints applied successfully!';
  RAISE NOTICE '📊 InPlay competitions: MUST have competition_type_id';
  RAISE NOTICE '⚔️ ONE 2 ONE challenges: MUST have rounds_covered, NO competition_type_id';
  RAISE NOTICE '🛡️ Database will now reject invalid format combinations';
END $$;

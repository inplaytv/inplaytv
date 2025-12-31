-- ============================================================================
-- ADD DELETION SAFEGUARDS
-- Prevents accidental deletion of competition_types and golfer_groups
-- ============================================================================

-- STEP 1: Add PREVENT DELETE trigger to competition_types
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_competition_type_deletion()
RETURNS TRIGGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Check if any competitions reference this type
  SELECT COUNT(*) INTO usage_count
  FROM tournament_competitions
  WHERE competition_type_id = OLD.id;

  IF usage_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete competition type "%" because % competition(s) are using it. Archive instead of deleting.', 
      OLD.name, usage_count
    USING HINT = 'Use an "archived" flag instead of DELETE';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_competition_type_deletion_trigger ON public.competition_types;
CREATE TRIGGER prevent_competition_type_deletion_trigger
  BEFORE DELETE ON public.competition_types
  FOR EACH ROW
  EXECUTE FUNCTION prevent_competition_type_deletion();

-- STEP 2: Add PREVENT DELETE trigger to golfer_groups
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_golfer_group_deletion()
RETURNS TRIGGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Check if any competitions reference this group
  SELECT COUNT(*) INTO usage_count
  FROM tournament_competitions
  WHERE assigned_golfer_group_id = OLD.id;

  IF usage_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete golfer group "%" because % competition(s) are using it.', 
      OLD.name, usage_count
    USING HINT = 'Remove the group assignment from competitions first';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_golfer_group_deletion_trigger ON public.golfer_groups;
CREATE TRIGGER prevent_golfer_group_deletion_trigger
  BEFORE DELETE ON public.golfer_groups
  FOR EACH ROW
  EXECUTE FUNCTION prevent_golfer_group_deletion();

-- STEP 3: Remove CASCADE DELETE from foreign key constraints
-- ============================================================================

-- Drop existing constraint with CASCADE DELETE
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'tournament_competitions'
    AND kcu.column_name = 'competition_type_id'
    AND tc.constraint_type = 'FOREIGN KEY'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE tournament_competitions DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No existing constraint found for competition_type_id';
  END IF;
END $$;

-- Re-create WITHOUT CASCADE DELETE
ALTER TABLE tournament_competitions
  ADD CONSTRAINT tournament_competitions_competition_type_fk
  FOREIGN KEY (competition_type_id)
  REFERENCES competition_types(id)
  ON DELETE RESTRICT; -- RESTRICT prevents deletion instead of cascading

-- DONE!
SELECT '✅ SAFEGUARDS INSTALLED' as status;
SELECT 'Competition types can no longer be deleted if in use' as info;
SELECT 'Golfer groups can no longer be deleted if assigned to competitions' as info;

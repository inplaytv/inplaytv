-- ============================================================================
-- EMERGENCY FIX: Restore Competition Types and Add Deletion Safeguards
-- ============================================================================
-- This fixes the broken unified system where competition_types were deleted
-- but competitions still reference them (orphaned references)
-- ============================================================================

-- STEP 1: Restore the 7 competition types using the EXACT IDs from existing competitions
-- ============================================================================

INSERT INTO public.competition_types (id, name, slug, description) VALUES
  ('bb67a06e-0000-0000-0000-000000000001', 'Full Course', 'full-course', '72-hole competition covering all 4 rounds'),
  ('4992498c-0000-0000-0000-000000000002', 'Beat The Cut', 'beat-the-cut', '36-hole competition covering rounds 1 and 2'),
  ('2511f1df-0000-0000-0000-000000000003', 'Round 1', 'round-1', 'First round only'),
  ('39e7b829-0000-0000-0000-000000000004', 'Round 2', 'round-2', 'Second round only'),
  ('18df0baa-0000-0000-0000-000000000005', 'Round 3', 'round-3', 'Third round only'),
  ('da140db5-0000-0000-0000-000000000006', 'Round 4', 'round-4', 'Final round only'),
  ('01bc3835-0000-0000-0000-000000000007', 'Final Strike', 'final-strike', 'Head-to-head challenge')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  updated_at = NOW();

-- STEP 2: Add PREVENT DELETE trigger to competition_types
-- ============================================================================
-- This ensures NO ONE can delete competition types if they're in use

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

-- Apply the trigger
DROP TRIGGER IF EXISTS prevent_competition_type_deletion_trigger ON public.competition_types;
CREATE TRIGGER prevent_competition_type_deletion_trigger
  BEFORE DELETE ON public.competition_types
  FOR EACH ROW
  EXECUTE FUNCTION prevent_competition_type_deletion();

-- STEP 3: Remove CASCADE DELETE from the foreign key constraint
-- ============================================================================

-- First, find and drop the existing constraint
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
  END IF;
END $$;

-- Re-create the constraint WITHOUT CASCADE DELETE
ALTER TABLE tournament_competitions
  ADD CONSTRAINT tournament_competitions_competition_type_fk
  FOREIGN KEY (competition_type_id)
  REFERENCES competition_types(id)
  ON DELETE RESTRICT; -- RESTRICT prevents deletion instead of cascading

-- STEP 4: Verify the fix
-- ============================================================================

-- Show restored competition types
SELECT 
  'Competition Types Restored:' as status,
  COUNT(*) as count
FROM competition_types;

SELECT 
  id,
  name,
  slug,
  description
FROM competition_types
ORDER BY name;

-- Show that competitions are now valid
SELECT 
  'InPlay Competitions Status:' as status,
  COUNT(*) as total,
  COUNT(DISTINCT ct.name) as unique_types
FROM tournament_competitions tc
JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE tc.competition_format = 'inplay';

-- STEP 5: Add safeguard to golfer_groups as well
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

-- DONE!
SELECT '✅ SAFEGUARDS INSTALLED' as status;
SELECT 'Competition types can no longer be deleted if in use' as protection;
SELECT 'Golfer groups can no longer be deleted if assigned to competitions' as protection;

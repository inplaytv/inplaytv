-- ===================================================================
-- RESTORE MISSING COMPETITION TYPES AND GOLFER GROUPS
-- This data should exist but is mysteriously missing
-- ===================================================================

-- 1. RESTORE COMPETITION TYPES (required for competitions to display names)
-- ===================================================================

INSERT INTO public.competition_types (id, name, slug, competition_format, description) VALUES
  ('bb67a06e-0000-0000-0000-000000000001', 'Full Course', 'full-course', 'inplay', '72-hole competition covering all 4 rounds'),
  ('4992498c-0000-0000-0000-000000000002', 'Beat The Cut', 'beat-the-cut', 'inplay', '36-hole competition covering rounds 1 and 2'),
  ('2511f1df-0000-0000-0000-000000000003', 'Round 1', 'round-1', 'inplay', 'First round only'),
  ('39e7b829-0000-0000-0000-000000000004', 'Round 2', 'round-2', 'inplay', 'Second round only'),
  ('18df0baa-0000-0000-0000-000000000005', 'Round 3', 'round-3', 'inplay', 'Third round only'),
  ('da140db5-0000-0000-0000-000000000006', 'Round 4', 'round-4', 'inplay', 'Final round only'),
  ('01bc3835-0000-0000-0000-000000000007', 'Final Strike', 'final-strike', 'one2one', 'Head-to-head challenge')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  competition_format = EXCLUDED.competition_format,
  description = EXCLUDED.description;

-- 2. RESTORE GOLFER GROUPS (required for competitions to have available golfers)
-- ===================================================================

-- Get tournament IDs
DO $$
DECLARE
  northforland_tournament_id UUID;
  westgate_tournament_id UUID;
  group_id_1 UUID := 'f63d553b-0000-0000-0000-000000000001';
  group_id_2 UUID := '59363fd1-0000-0000-0000-000000000002';
BEGIN
  -- Get tournament IDs
  SELECT id INTO northforland_tournament_id FROM tournaments WHERE slug = 'northforland-open-tournament' LIMIT 1;
  SELECT id INTO westgate_tournament_id FROM tournaments WHERE slug = 'westgate-birchington-golf-club' LIMIT 1;

  -- Create golfer groups
  IF northforland_tournament_id IS NOT NULL THEN
    INSERT INTO public.golfer_groups (id, tournament_id, name, description)
    VALUES (
      group_id_1,
      northforland_tournament_id,
      'Northforland Open Field',
      'All golfers eligible for Northforland Open Tournament'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description;
      
    RAISE NOTICE 'Created/Updated golfer group for Northforland Open';
  END IF;

  IF westgate_tournament_id IS NOT NULL THEN
    INSERT INTO public.golfer_groups (id, tournament_id, name, description)
    VALUES (
      group_id_2,
      westgate_tournament_id,
      'WESTGATE & BIRCHINGTON Field',
      'All golfers eligible for WESTGATE & BIRCHINGTON tournament'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description;
      
    RAISE NOTICE 'Created/Updated golfer group for WESTGATE & BIRCHINGTON';
  END IF;
END $$;

-- 3. VERIFY RESTORATION
-- ===================================================================

SELECT 
  'competition_types' as table_name,
  COUNT(*) as record_count
FROM competition_types

UNION ALL

SELECT 
  'golfer_groups' as table_name,
  COUNT(*) as record_count
FROM golfer_groups;

-- 4. SHOW WHAT WAS RESTORED
-- ===================================================================

SELECT 'Competition Types:' as info;
SELECT name, slug, competition_format FROM competition_types ORDER BY name;

SELECT '' as spacer;
SELECT 'Golfer Groups:' as info;
SELECT 
  gg.name,
  t.name as tournament_name,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = gg.id) as member_count
FROM golfer_groups gg
LEFT JOIN tournaments t ON t.id = gg.tournament_id
ORDER BY gg.created_at;

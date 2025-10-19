-- ===================================================================
-- GOLFER GROUPS SYSTEM - Complete Redesign
-- Run this in Supabase Dashboard SQL Editor
-- Creates a group-based system for managing tournament golfers
-- ===================================================================

-- Drop old tables if they exist (from previous implementation)
DROP TABLE IF EXISTS public.tournament_golfers CASCADE;

-- ===================================================================
-- 1. GOLFERS TABLE (Master Database)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.golfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  world_ranking INTEGER,
  points_won DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  external_id TEXT UNIQUE, -- For API integration (PGA Tour ID, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast searching
CREATE INDEX IF NOT EXISTS idx_golfers_full_name ON public.golfers(full_name);
CREATE INDEX IF NOT EXISTS idx_golfers_external_id ON public.golfers(external_id);
CREATE INDEX IF NOT EXISTS idx_golfers_world_ranking ON public.golfers(world_ranking);

-- ===================================================================
-- 2. GOLFER GROUPS TABLE (Named Collections)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.golfer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Masters 2025 Full Field", "Masters 2025 After Cut"
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Hex color for UI badges
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_golfer_groups_slug ON public.golfer_groups(slug);

-- ===================================================================
-- 3. GOLFER GROUP MEMBERS (Which golfers are in which groups)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.golfer_group_members (
  group_id UUID NOT NULL REFERENCES public.golfer_groups(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES public.golfers(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, golfer_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.golfer_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_golfer ON public.golfer_group_members(golfer_id);

-- ===================================================================
-- 4. TOURNAMENT GOLFER GROUPS (Which groups are assigned to which tournaments)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.tournament_golfer_groups (
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.golfer_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tournament_id, group_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tournament_groups_tournament ON public.tournament_golfer_groups(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_groups_group ON public.tournament_golfer_groups(group_id);

-- ===================================================================
-- 5. COMPETITION GOLFERS (Which golfers are available in which competitions)
-- ===================================================================
-- This links specific golfers to specific competitions
-- Example: Round 1-4 gets all golfers from "Full Field" group
--          Round 4 gets only golfers from "After Cut" group
CREATE TABLE IF NOT EXISTS public.competition_golfers (
  competition_id UUID NOT NULL REFERENCES public.tournament_competitions(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES public.golfers(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (competition_id, golfer_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_competition_golfers_competition ON public.competition_golfers(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_golfers_golfer ON public.competition_golfers(golfer_id);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE public.golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golfer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golfer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_golfer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_golfers ENABLE ROW LEVEL SECURITY;

-- Golfers: Public read, admin write
CREATE POLICY "Golfers are viewable by everyone"
  ON public.golfers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Golfers are manageable by admins"
  ON public.golfers FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- Golfer Groups: Public read, admin write
CREATE POLICY "Golfer groups are viewable by everyone"
  ON public.golfer_groups FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Golfer groups are manageable by admins"
  ON public.golfer_groups FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- Group Members: Public read, admin write
CREATE POLICY "Group members are viewable by everyone"
  ON public.golfer_group_members FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Group members are manageable by admins"
  ON public.golfer_group_members FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- Tournament Groups: Public read, admin write
CREATE POLICY "Tournament groups are viewable by everyone"
  ON public.tournament_golfer_groups FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Tournament groups are manageable by admins"
  ON public.tournament_golfer_groups FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- Competition Golfers: Public read, admin write
CREATE POLICY "Competition golfers are viewable by everyone"
  ON public.competition_golfers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Competition golfers are manageable by admins"
  ON public.competition_golfers FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE public.golfers IS 'Master database of all golfers. Individual golfers who can be added to groups.';
COMMENT ON TABLE public.golfer_groups IS 'Named collections of golfers (e.g., "Masters 2025 Full Field"). Reusable across tournaments.';
COMMENT ON TABLE public.golfer_group_members IS 'Junction table linking golfers to groups. Defines which golfers belong to which groups.';
COMMENT ON TABLE public.tournament_golfer_groups IS 'Junction table linking groups to tournaments. A tournament can have multiple groups assigned.';
COMMENT ON TABLE public.competition_golfers IS 'Links specific golfers to specific competitions. Populated from tournament groups but can be filtered per competition.';

COMMENT ON COLUMN public.golfers.external_id IS 'External system ID (e.g., PGA Tour ID) for API integration';
COMMENT ON COLUMN public.golfer_groups.color IS 'Hex color for UI display (e.g., badges, chips)';
COMMENT ON COLUMN public.golfer_groups.slug IS 'URL-friendly identifier for the group';

-- ===================================================================
-- NO SAMPLE DATA - Import CSV files to populate
-- ===================================================================

-- ===================================================================
-- HELPER VIEWS (Optional - for easier querying)
-- ===================================================================

-- View: All golfers in a group with their details
CREATE OR REPLACE VIEW public.v_group_golfers AS
SELECT 
  gg.id AS group_id,
  gg.name AS group_name,
  gg.slug AS group_slug,
  gg.color AS group_color,
  g.id AS golfer_id,
  g.full_name AS golfer_name,
  g.image_url AS golfer_image,
  g.external_id AS golfer_external_id,
  ggm.added_at
FROM public.golfer_groups gg
JOIN public.golfer_group_members ggm ON gg.id = ggm.group_id
JOIN public.golfers g ON ggm.golfer_id = g.id;

-- View: All groups assigned to a tournament
CREATE OR REPLACE VIEW public.v_tournament_groups AS
SELECT 
  t.id AS tournament_id,
  t.name AS tournament_name,
  gg.id AS group_id,
  gg.name AS group_name,
  gg.slug AS group_slug,
  gg.color AS group_color,
  tgg.added_at
FROM public.tournaments t
JOIN public.tournament_golfer_groups tgg ON t.id = tgg.tournament_id
JOIN public.golfer_groups gg ON tgg.group_id = gg.id;

-- View: All golfers available in a competition
CREATE OR REPLACE VIEW public.v_competition_golfers AS
SELECT 
  tc.id AS competition_id,
  tc.tournament_id,
  ct.name AS competition_name,
  g.id AS golfer_id,
  g.full_name AS golfer_name,
  g.image_url AS golfer_image,
  cg.added_at
FROM public.tournament_competitions tc
JOIN public.competition_types ct ON tc.competition_type_id = ct.id
JOIN public.competition_golfers cg ON tc.id = cg.competition_id
JOIN public.golfers g ON cg.golfer_id = g.id;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Golfer Groups System created successfully!';
  RAISE NOTICE '📊 No sample data - use CSV import to add golfers';
  RAISE NOTICE '🎯 Next: Import CSV files via admin panel';
END $$;

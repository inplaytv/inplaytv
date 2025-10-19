-- ===================================================================
-- TOURNAMENT GOLFERS TABLE
-- Run this in Supabase Dashboard SQL Editor
-- Manages golfers participating in tournaments
-- ===================================================================

-- Create golfers table (master golfer database)
CREATE TABLE IF NOT EXISTS public.golfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  image_url TEXT,
  external_id TEXT, -- For API integrations
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_golfers_full_name ON public.golfers(full_name);
CREATE INDEX IF NOT EXISTS idx_golfers_external_id ON public.golfers(external_id);

-- Create tournament_golfers junction table
CREATE TABLE IF NOT EXISTS public.tournament_golfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES public.golfers(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, golfer_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_tournament ON public.tournament_golfers(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_golfer ON public.tournament_golfers(golfer_id);

-- Enable RLS
ALTER TABLE public.golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_golfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "golfers_public_read" ON public.golfers;
CREATE POLICY "golfers_public_read"
  ON public.golfers
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "golfers_admin_all" ON public.golfers;
CREATE POLICY "golfers_admin_all"
  ON public.golfers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tournament_golfers_public_read" ON public.tournament_golfers;
CREATE POLICY "tournament_golfers_public_read"
  ON public.tournament_golfers
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tournament_golfers_admin_all" ON public.tournament_golfers;
CREATE POLICY "tournament_golfers_admin_all"
  ON public.tournament_golfers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS golfers_updated_at ON public.golfers;
CREATE TRIGGER golfers_updated_at
  BEFORE UPDATE ON public.golfers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.golfers IS 'Master database of all golfers. Golfers can be added to multiple tournaments.';
COMMENT ON TABLE public.tournament_golfers IS 'Junction table linking golfers to tournaments. Tournament cannot go live without golfers.';

-- Add sample golfers (optional - remove if you want to start fresh)
INSERT INTO public.golfers (first_name, last_name, external_id) VALUES
('Tiger', 'Woods', 'tw-001'),
('Rory', 'McIlroy', 'rm-001'),
('Jon', 'Rahm', 'jr-001'),
('Scottie', 'Scheffler', 'ss-001'),
('Brooks', 'Koepka', 'bk-001')
ON CONFLICT DO NOTHING;

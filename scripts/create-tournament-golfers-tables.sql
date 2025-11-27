-- ===================================================================
-- TOURNAMENT GOLFERS TABLE - DataGolf Integration Version
-- Run this in Supabase SQL Editor
-- This creates/updates tables to support DataGolf API integration
-- ===================================================================

-- Step 1: Create or update golfers table with DataGolf support
CREATE TABLE IF NOT EXISTS public.golfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Full name (e.g., "Tiger Woods")
  country TEXT,                          -- Country code (e.g., "USA")
  dg_id INTEGER UNIQUE,                  -- DataGolf ID (unique identifier)
  pga_tour_id TEXT,                      -- PGA Tour official ID
  image_url TEXT,                        -- Profile image
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If table exists with old schema, add new columns
DO $$ 
BEGIN
    -- Add dg_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'golfers' 
                   AND column_name = 'dg_id') THEN
        ALTER TABLE public.golfers ADD COLUMN dg_id INTEGER UNIQUE;
    END IF;
    
    -- Add country if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'golfers' 
                   AND column_name = 'country') THEN
        ALTER TABLE public.golfers ADD COLUMN country TEXT;
    END IF;
    
    -- Add pga_tour_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'golfers' 
                   AND column_name = 'pga_tour_id') THEN
        ALTER TABLE public.golfers ADD COLUMN pga_tour_id TEXT;
    END IF;
    
    -- Add name if it doesn't exist (for old first_name/last_name schemas)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'golfers' 
                   AND column_name = 'name') THEN
        ALTER TABLE public.golfers ADD COLUMN name TEXT;
        
        -- If first_name and last_name exist, migrate data
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'golfers' 
                   AND column_name = 'first_name') THEN
            UPDATE public.golfers 
            SET name = CONCAT(first_name, ' ', last_name)
            WHERE name IS NULL;
        END IF;
    END IF;
END $$;

-- Make name NOT NULL after migration
ALTER TABLE public.golfers ALTER COLUMN name SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_golfers_name ON public.golfers(name);
CREATE INDEX IF NOT EXISTS idx_golfers_dg_id ON public.golfers(dg_id);
CREATE INDEX IF NOT EXISTS idx_golfers_country ON public.golfers(country);
CREATE INDEX IF NOT EXISTS idx_golfers_pga_tour_id ON public.golfers(pga_tour_id);

-- Step 2: Create tournament_golfers junction table
CREATE TABLE IF NOT EXISTS public.tournament_golfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES public.golfers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',       -- confirmed, wd (withdrawn), injured
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, golfer_id)
);

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tournament_golfers' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.tournament_golfers ADD COLUMN status TEXT DEFAULT 'confirmed';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_tournament ON public.tournament_golfers(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_golfer ON public.tournament_golfers(golfer_id);
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_status ON public.tournament_golfers(status);

-- Step 3: Enable RLS
ALTER TABLE public.golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_golfers ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies - Public read, admin write
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

-- Step 5: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add updated_at trigger to golfers table
DROP TRIGGER IF EXISTS golfers_updated_at ON public.golfers;
CREATE TRIGGER golfers_updated_at
  BEFORE UPDATE ON public.golfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Step 7: Verify tables exist
SELECT 
  'Table created/updated' as status,
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('golfers', 'tournament_golfers')
ORDER BY tablename;

-- Step 8: Show golfers table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'golfers'
ORDER BY ordinal_position;

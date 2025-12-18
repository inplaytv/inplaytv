-- ===================================================================
-- IMAGE MANAGEMENT SYSTEM
-- Centralized system for managing platform images
-- Run in Supabase SQL Editor
-- ===================================================================

-- 1. CREATE IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.platform_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tournament_background', 'tournament_card', 'hero', 'general')),
  storage_path TEXT NOT NULL UNIQUE,  -- Path in Supabase storage
  public_url TEXT NOT NULL,            -- Full public URL
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_platform_images_category ON public.platform_images(category);
CREATE INDEX IF NOT EXISTS idx_platform_images_uploaded_by ON public.platform_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_platform_images_created_at ON public.platform_images(created_at DESC);

-- Enable RLS
ALTER TABLE public.platform_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "platform_images_public_read" ON public.platform_images;
CREATE POLICY "platform_images_public_read"
  ON public.platform_images
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "platform_images_admin_all" ON public.platform_images;
CREATE POLICY "platform_images_admin_all"
  ON public.platform_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 2. CREATE TOURNAMENT BACKGROUND SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.tournament_background_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES public.platform_images(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,             -- Direct URL for quick access
  opacity DECIMAL(3,2) NOT NULL DEFAULT 0.15 CHECK (opacity >= 0 AND opacity <= 1),
  overlay DECIMAL(3,2) NOT NULL DEFAULT 0.4 CHECK (overlay >= 0 AND overlay <= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active setting at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_bg_active ON public.tournament_background_settings(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.tournament_background_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF NOT EXISTS "tournament_bg_public_read" ON public.tournament_background_settings;
CREATE POLICY "tournament_bg_public_read"
  ON public.tournament_background_settings
  FOR SELECT
  USING (true);

DROP POLICY IF NOT EXISTS "tournament_bg_admin_all" ON public.tournament_background_settings;
CREATE POLICY "tournament_bg_admin_all"
  ON public.tournament_background_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 3. ADD CARD IMAGE COLUMN TO TOURNAMENTS TABLE
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS card_image_id UUID REFERENCES public.platform_images(id) ON DELETE SET NULL;

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS card_image_url TEXT;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_tournaments_card_image ON public.tournaments(card_image_id);

-- 4. TRIGGER FOR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_platform_images_updated_at ON public.platform_images;
CREATE TRIGGER update_platform_images_updated_at
    BEFORE UPDATE ON public.platform_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournament_bg_updated_at ON public.tournament_background_settings;
CREATE TRIGGER update_tournament_bg_updated_at
    BEFORE UPDATE ON public.tournament_background_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. INSERT DEFAULT BACKGROUND SETTING
INSERT INTO public.tournament_background_settings (
  image_url,
  opacity,
  overlay,
  is_active
) VALUES (
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070',
  0.15,
  0.4,
  true
) ON CONFLICT DO NOTHING;

-- 6. COMMENTS
COMMENT ON TABLE public.platform_images IS 'Centralized image library for all platform images';
COMMENT ON TABLE public.tournament_background_settings IS 'Background image settings for tournaments page (fullscreen)';
COMMENT ON COLUMN public.tournaments.card_image_id IS 'Reference to platform_images for tournament card display';
COMMENT ON COLUMN public.tournaments.card_image_url IS 'Direct URL for tournament card image (denormalized for performance)';

-- ===================================================================
-- VERIFY INSTALLATION
-- ===================================================================
SELECT 
  'platform_images' as table_name,
  COUNT(*) as row_count
FROM public.platform_images
UNION ALL
SELECT 
  'tournament_background_settings' as table_name,
  COUNT(*) as row_count
FROM public.tournament_background_settings;

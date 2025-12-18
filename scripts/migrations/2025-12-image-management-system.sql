-- ===================================================================
-- IMAGE MANAGEMENT SYSTEM
-- Created: December 15, 2025
-- Purpose: Centralized image storage and tournament background/card management
-- ===================================================================

-- ===================================================================
-- 1. ADMIN IMAGES TABLE (Image Library)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.admin_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('tournament_background', 'tournament_card', 'general')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE, -- Path in Supabase storage
  public_url TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_images_category ON public.admin_images(category);
CREATE INDEX IF NOT EXISTS idx_admin_images_uploaded_by ON public.admin_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_admin_images_created_at ON public.admin_images(created_at DESC);

-- RLS Policies
ALTER TABLE public.admin_images ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view images)
DROP POLICY IF EXISTS "admin_images_public_read" ON public.admin_images;
CREATE POLICY "admin_images_public_read"
  ON public.admin_images
  FOR SELECT
  USING (true);

-- Admin-only write access
DROP POLICY IF EXISTS "admin_images_admin_all" ON public.admin_images;
CREATE POLICY "admin_images_admin_all"
  ON public.admin_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_admin_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_images_updated_at ON public.admin_images;
CREATE TRIGGER trigger_admin_images_updated_at
  BEFORE UPDATE ON public.admin_images
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_images_updated_at();

COMMENT ON TABLE public.admin_images IS 'Centralized image library for tournament backgrounds, card images, and general use';

-- ===================================================================
-- 2. TOURNAMENT PAGE BACKGROUND SETTINGS
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.tournament_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_image_id UUID REFERENCES public.admin_images(id) ON DELETE SET NULL,
  background_opacity DECIMAL(3,2) NOT NULL DEFAULT 0.15 CHECK (background_opacity >= 0 AND background_opacity <= 1),
  overlay_opacity DECIMAL(3,2) NOT NULL DEFAULT 0.40 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 1),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one settings record should exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_page_settings_singleton ON public.tournament_page_settings((true));

-- RLS Policies
ALTER TABLE public.tournament_page_settings ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "tournament_page_settings_public_read" ON public.tournament_page_settings;
CREATE POLICY "tournament_page_settings_public_read"
  ON public.tournament_page_settings
  FOR SELECT
  USING (true);

-- Admin-only write
DROP POLICY IF EXISTS "tournament_page_settings_admin_all" ON public.tournament_page_settings;
CREATE POLICY "tournament_page_settings_admin_all"
  ON public.tournament_page_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_tournament_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tournament_page_settings_updated_at ON public.tournament_page_settings;
CREATE TRIGGER trigger_tournament_page_settings_updated_at
  BEFORE UPDATE ON public.tournament_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_page_settings_updated_at();

-- Insert default settings
INSERT INTO public.tournament_page_settings (background_opacity, overlay_opacity)
VALUES (0.15, 0.40)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.tournament_page_settings IS 'Settings for tournaments page background image and overlays';

-- ===================================================================
-- 3. ADD CARD IMAGE TO TOURNAMENTS TABLE
-- ===================================================================
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS card_image_id UUID REFERENCES public.admin_images(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tournaments_card_image ON public.tournaments(card_image_id);

COMMENT ON COLUMN public.tournaments.card_image_id IS 'Custom card image for this tournament (overrides default)';

-- ===================================================================
-- VERIFICATION
-- ===================================================================
SELECT 'Image Management System migration completed successfully!' AS status;

-- Show created tables
SELECT 
  'Created tables:' as info,
  schemaname,
  tablename 
FROM pg_tables 
WHERE tablename IN ('admin_images', 'tournament_page_settings')
  AND schemaname = 'public';

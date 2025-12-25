-- ===================================================================
-- CREATE ADVERTISEMENT SETTINGS TABLE
-- ===================================================================
-- This table stores all advertisement content for the platform
-- Includes tournament featured card ad and scorecard confirmation ads
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.advertisement_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tournament Featured Card Ad
  tournament_featured_partner_label TEXT DEFAULT 'OFFICIAL PARTNER',
  tournament_featured_company_name TEXT DEFAULT 'Premium Golf Equipment',
  tournament_featured_tagline TEXT DEFAULT 'Elevate Your Game',
  tournament_featured_cta_text TEXT DEFAULT 'Shop Now',
  tournament_featured_link_url TEXT,
  
  -- Scorecard Confirmation Ad Slot 1
  scorecard_ad1_company_name TEXT DEFAULT 'Sponsor 1',
  scorecard_ad1_tagline TEXT DEFAULT 'Your tagline here',
  scorecard_ad1_image_url TEXT,
  scorecard_ad1_link_url TEXT,
  
  -- Scorecard Confirmation Ad Slot 2
  scorecard_ad2_company_name TEXT DEFAULT 'Sponsor 2',
  scorecard_ad2_tagline TEXT DEFAULT 'Your tagline here',
  scorecard_ad2_image_url TEXT,
  scorecard_ad2_link_url TEXT,
  
  -- Scorecard Confirmation Ad Slot 3
  scorecard_ad3_company_name TEXT DEFAULT 'Sponsor 3',
  scorecard_ad3_tagline TEXT DEFAULT 'Your tagline here',
  scorecard_ad3_image_url TEXT,
  scorecard_ad3_link_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.advertisement_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.advertisement_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for displaying ads)
CREATE POLICY "Anyone can read advertisement settings"
  ON public.advertisement_settings
  FOR SELECT
  USING (true);

-- Only admins can update (controlled by API routes with admin checks)
CREATE POLICY "Service role can update advertisement settings"
  ON public.advertisement_settings
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.advertisement_settings IS 
'Stores advertisement content for tournament featured cards and scorecard confirmation pages';

-- ===================================================================
-- PROMOTIONAL CARDS TABLE
-- Manages the hard-coded promotional tournament cards
-- Run this in Supabase Dashboard SQL Editor
-- ===================================================================

-- Create promotional_cards table
CREATE TABLE IF NOT EXISTS public.promotional_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  location TEXT,
  date_range TEXT,
  prize_pool_display TEXT,
  entries_display TEXT,
  entry_fee_display TEXT,
  first_place_display TEXT,
  background_image TEXT NOT NULL DEFAULT 'default.jpg', -- e.g., 'golf-bg-01.jpg'
  card_type TEXT NOT NULL DEFAULT 'featured' CHECK (card_type IN ('featured', 'small')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  link_url TEXT, -- Optional link (e.g., '/team-builder/masters-2025')
  badge_text TEXT, -- e.g., 'FULL COURSE', 'BEAT THE CUT'
  badge_style TEXT, -- e.g., 'default', 'elite'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promotional_cards_active ON public.promotional_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_promotional_cards_order ON public.promotional_cards(display_order);
CREATE INDEX IF NOT EXISTS idx_promotional_cards_type ON public.promotional_cards(card_type);

-- Enable RLS
ALTER TABLE public.promotional_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read active cards, admin write all
DROP POLICY IF EXISTS "promotional_cards_public_read" ON public.promotional_cards;
CREATE POLICY "promotional_cards_public_read"
  ON public.promotional_cards
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "promotional_cards_admin_all" ON public.promotional_cards;
CREATE POLICY "promotional_cards_admin_all"
  ON public.promotional_cards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_promotional_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS promotional_cards_updated_at ON public.promotional_cards;
CREATE TRIGGER promotional_cards_updated_at
  BEFORE UPDATE ON public.promotional_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_cards_updated_at();

-- Insert default promotional cards (matching current hard-coded data)
INSERT INTO public.promotional_cards (
  title, subtitle, location, date_range,
  prize_pool_display, entries_display, entry_fee_display, first_place_display,
  background_image, card_type, display_order, badge_text, badge_style
) VALUES 
(
  'Masters Tournament 2025',
  'THE FULL COURSE - The Complete Competition',
  'Augusta National Golf Club',
  'April 10-13, 2025',
  '£2.5M',
  '12,847',
  '£25',
  '£500K',
  'golf-bg-01.jpg',
  'featured',
  1,
  'FULL COURSE',
  'default'
),
(
  'PGA Championship 2025',
  'BEAT THE CUT - 36 Holes Competition',
  'Kiawah Island Golf Resort',
  'May 15-18, 2025',
  '£1.8M',
  '9,234',
  '£20',
  '£350K',
  'golf-bg-02.jpg',
  'featured',
  2,
  'BEAT THE CUT',
  'elite'
),
(
  'US Open Championship',
  'COMING SOON',
  'Pebble Beach Golf Links',
  'June 2025',
  '£1.8M',
  '8,234',
  '£15',
  '£350K',
  'golf-bg-03.jpg',
  'small',
  3,
  'COMING SOON',
  'default'
),
(
  'The Open Championship',
  'COMING SOON',
  'St Andrews Links',
  'July 2025',
  '£2.2M',
  '9,567',
  '£18',
  '£400K',
  'golf-bg-04.jpg',
  'small',
  4,
  'COMING SOON',
  'round2'
),
(
  'Ryder Cup 2025',
  'COMING SOON',
  'Bethpage Black',
  'September 2025',
  '£3.0M',
  '15,234',
  '£30',
  '£600K',
  'golf-bg-05.jpg',
  'small',
  5,
  'COMING SOON',
  'default'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Promotional cards table created successfully!';
  RAISE NOTICE 'Added 5 default promotional cards';
  RAISE NOTICE 'Next: Create admin interface to manage these cards';
END $$;

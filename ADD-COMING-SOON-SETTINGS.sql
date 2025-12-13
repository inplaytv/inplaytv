-- ===================================================================
-- COMING SOON PAGE CUSTOMIZATION SETTINGS
-- ===================================================================
-- Adds database fields to customize the coming soon page content

-- Add new settings for coming soon page customization
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES 
  ('coming_soon_headline', 'COMING SOON'),
  ('coming_soon_description', 'Precision meets passion in a live, immersive format. Competition will never emerge the same.'),
  ('coming_soon_background_image', '/backgrounds/golf-03.jpg'),
  ('coming_soon_logo_text', 'InPlayTV'),
  ('coming_soon_tagline', 'A new way to follow what matters.')
ON CONFLICT (setting_key) 
DO NOTHING;

-- Verify settings
SELECT 
  '✅ Coming soon settings added!' as status,
  setting_key,
  setting_value
FROM public.site_settings
WHERE setting_key LIKE 'coming_soon_%'
ORDER BY setting_key;

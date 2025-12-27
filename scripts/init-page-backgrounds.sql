-- Initialize page background settings for all pages
-- Run this in Supabase SQL Editor

-- Insert or update default backgrounds for each page
INSERT INTO public.site_settings (setting_key, setting_value, updated_at)
VALUES 
  ('tournament_page_background', '{"backgroundImage":"/backgrounds/golf-03.jpg","backgroundUrl":"/backgrounds/golf-03.jpg","opacity":0.15,"overlay":0.4}', NOW()),
  ('lobby_page_background', '{"backgroundImage":"/backgrounds/golf-01.jpg","backgroundUrl":"/backgrounds/golf-01.jpg","opacity":0.15,"overlay":0.4}', NOW()),
  ('entries_page_background', '{"backgroundImage":"/backgrounds/golf-02.jpg","backgroundUrl":"/backgrounds/golf-02.jpg","opacity":0.15,"overlay":0.4}', NOW()),
  ('leaderboards_page_background', '{"backgroundImage":"/backgrounds/golf-04.jpg","backgroundUrl":"/backgrounds/golf-04.jpg","opacity":0.15,"overlay":0.4}', NOW()),
  ('one2one_page_background', '{"backgroundImage":"/backgrounds/golf-05.jpg","backgroundUrl":"/backgrounds/golf-05.jpg","opacity":0.15,"overlay":0.4}', NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Verify the settings
SELECT 
  setting_key,
  setting_value::json->>'backgroundImage' as background_image,
  updated_at
FROM public.site_settings
WHERE setting_key LIKE '%_page_background'
ORDER BY setting_key;

-- Show current tournament background if it exists
SELECT 
  setting_key,
  setting_value
FROM public.site_settings
WHERE setting_key = 'tournament_page_background';

-- Fix the coming soon page settings
UPDATE site_settings 
SET setting_value = 'COMING SOON' 
WHERE setting_key = 'coming_soon_headline';

UPDATE site_settings 
SET setting_value = '' 
WHERE setting_key = 'coming_soon_background_image';

-- Verify the changes
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key IN ('coming_soon_headline', 'coming_soon_background_image');
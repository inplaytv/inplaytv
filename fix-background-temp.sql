-- Temporarily use an external background image URL
UPDATE site_settings 
SET setting_value = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1920&q=80'
WHERE setting_key = 'coming_soon_background_image';

-- Check the result
SELECT * FROM site_settings WHERE setting_key LIKE 'coming_soon%';

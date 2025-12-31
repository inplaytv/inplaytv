-- RESTORE NORMAL DEVELOPMENT MODE
-- Run this in your LOCAL Supabase SQL Editor to unlock your site

UPDATE site_settings 
SET setting_value = 'live' 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Verify it's back to live
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Turn OFF maintenance mode in LOCAL database
-- Run this in your LOCAL Supabase (not production!)

UPDATE site_settings 
SET setting_value = 'live' 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Verify it worked
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Both should show 'live'

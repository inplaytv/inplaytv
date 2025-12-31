-- TEST MAINTENANCE MODE LOCALLY
-- Run this in your LOCAL Supabase SQL Editor

-- Step 1: Check current mode
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Step 2: Enable maintenance mode for testing
UPDATE site_settings 
SET setting_value = 'maintenance' 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Step 3: Verify
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- After testing, disable maintenance mode:
-- UPDATE site_settings 
-- SET setting_value = 'live' 
-- WHERE setting_key IN ('site_mode', 'maintenance_mode');

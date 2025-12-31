-- PRODUCTION FIX: Lock site to admin-only access
-- Run this in PRODUCTION Supabase SQL Editor at supabase.com

UPDATE site_settings 
SET setting_value = 'maintenance' 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Verify it worked
SELECT setting_key, setting_value 
FROM site_settings 
WHERE setting_key IN ('site_mode', 'maintenance_mode');

-- Should show both as 'maintenance'

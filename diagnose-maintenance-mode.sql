-- DIAGNOSTIC: Check Maintenance Mode Status
-- Run this in your LOCAL Supabase SQL Editor

-- 1. Check site_settings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'site_settings'
) as site_settings_exists;

-- 2. Check current maintenance mode settings
SELECT 
  setting_key, 
  setting_value,
  CASE 
    WHEN setting_value = 'maintenance' THEN '🔒 LOCKED (admin only)'
    WHEN setting_value = 'coming_soon' THEN '🔔 COMING SOON (admins bypass)'
    WHEN setting_value = 'live' THEN '🌐 LIVE (public access)'
    ELSE '❓ UNKNOWN'
  END as status_description
FROM site_settings 
WHERE setting_key IN ('site_mode', 'maintenance_mode')
ORDER BY setting_key;

-- 3. Check if YOU are an admin (replace with your email)
SELECT 
  u.email,
  CASE 
    WHEN a.user_id IS NOT NULL THEN '✅ IS ADMIN'
    ELSE '❌ NOT ADMIN'
  END as admin_status
FROM auth.users u
LEFT JOIN admins a ON a.user_id = u.id
WHERE u.email = 'leroyg@live.com';

-- 4. List all admins
SELECT 
  u.email,
  a.created_at as admin_since
FROM admins a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC;

-- QUICK FIX: If maintenance mode not set, run this:
-- INSERT INTO site_settings (setting_key, setting_value)
-- VALUES 
--   ('site_mode', 'maintenance'),
--   ('maintenance_mode', 'maintenance')
-- ON CONFLICT (setting_key) 
-- DO UPDATE SET setting_value = 'maintenance';

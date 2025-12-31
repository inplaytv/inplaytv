-- Check if your user ID matches what's in admins table
-- Run this in PRODUCTION Supabase

-- 1. Find your user ID
SELECT id, email FROM auth.users WHERE email = 'leroyg@live.com';

-- 2. Check if that ID is in admins table
SELECT * FROM admins WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'leroyg@live.com');

-- 3. Double-check the exact user_id match
SELECT 
  u.id as user_id,
  u.email,
  a.user_id as admin_user_id,
  (a.user_id IS NOT NULL) as is_admin
FROM auth.users u
LEFT JOIN admins a ON u.id = a.user_id
WHERE u.email = 'leroyg@live.com';

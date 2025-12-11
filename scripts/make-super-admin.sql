-- ===================================================================
-- MAKE YOUR ACCOUNT A SUPER ADMIN
-- ===================================================================

-- Step 1: Find your user_id by email
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'leroylive@gmail.com';

-- Step 2: Copy the user_id from above, then run this:
-- (Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1)

-- UPDATE admins 
-- SET is_super_admin = true 
-- WHERE user_id = 'YOUR_USER_ID_HERE';

-- Step 3: Verify super admin was set
-- SELECT 
--   a.user_id,
--   u.email,
--   a.is_super_admin,
--   a.created_at
-- FROM admins a
-- LEFT JOIN auth.users u ON u.id = a.user_id
-- WHERE u.email = 'leroylive@gmail.com';

-- ===================================================================
-- OR USE THIS ONE-LINER (automatically finds and updates):
-- ===================================================================

UPDATE admins 
SET is_super_admin = true 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'leroylive@gmail.com'
);

-- Verify
SELECT 
  a.user_id,
  u.email,
  a.is_super_admin,
  a.created_at
FROM admins a
LEFT JOIN auth.users u ON u.id = a.user_id
WHERE u.email = 'leroylive@gmail.com';

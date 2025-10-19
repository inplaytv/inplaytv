-- =====================================================
-- BOOTSTRAP ADMIN USER - Run in Supabase SQL Editor
-- =====================================================

-- Step 1: Find your user ID (must have signed up in the golf app first)
-- Replace 'your-email@example.com' with your actual email
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Step 2: Copy the 'id' from above and use it below
-- Replace <paste-user-id-here> with the actual UUID
INSERT INTO public.admins(user_id) 
VALUES ('<paste-user-id-here>');

-- Step 3: Verify admin was created
SELECT 
  a.user_id,
  u.email,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id;

-- Step 4: Test the helper function
SELECT public.is_admin('<paste-user-id-here>');
-- Should return: true

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If you don't see any users in auth.users:
-- 1. Go to http://localhost:3001 (golf app)
-- 2. Click "Sign Up" and create an account
-- 3. Check your email for verification link
-- 4. Come back and run Step 1 again

-- If you need to remove admin access:
DELETE FROM public.admins WHERE user_id = '<user-id>';

-- List all current admins:
SELECT 
  a.user_id,
  u.email,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC;

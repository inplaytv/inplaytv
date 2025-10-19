-- DEBUG: Check if admin setup is working
-- Run these queries in Supabase SQL Editor to troubleshoot login issues

-- 1. Check if admins table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admins'
) as admins_table_exists;

-- 2. Check if your user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if your user is in the admins table
SELECT * FROM public.admins;

-- 4. Test the is_admin function
-- Replace 'your-user-id-here' with your actual user ID from step 2
SELECT public.is_admin('your-user-id-here') as is_user_admin;

-- 5. Check RLS policies on admins table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'admins';

-- QUICK FIX: If you need to add yourself as admin
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Make sure you signed up first!';
  END IF;
  
  -- Insert as admin (using ON CONFLICT to avoid duplicates)
  INSERT INTO public.admins(user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'User % is now an admin', v_user_id;
END $$;

-- 6. Verify it worked
SELECT 
  a.user_id,
  u.email,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id;

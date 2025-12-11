-- ===================================================================
-- DEBUG SIGNUP ISSUE
-- ===================================================================
-- This script checks all potential blockers for profile creation

-- 1. Check if profiles table exists and its structure
SELECT 
  '=== PROFILES TABLE STRUCTURE ===' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check RLS policies on profiles
SELECT 
  '=== RLS POLICIES ===' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 3. Check if RLS is enabled
SELECT 
  '=== RLS STATUS ===' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 4. Check constraints on profiles
SELECT 
  '=== CONSTRAINTS ===' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles';

-- 5. Check triggers on profiles
SELECT 
  '=== TRIGGERS ===' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles';

-- 6. Try a test insert (will fail but show exact error)
DO $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name)
  VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'testuser123',
    'Test',
    'User'
  );
  RAISE NOTICE '✅ Test insert succeeded!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Test insert failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- Clean up test insert if it succeeded
DELETE FROM public.profiles WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- ===================================================================
-- FIX PROFILES RLS FOR LEADERBOARD QUERIES
-- ===================================================================
-- Problem: Leaderboard API can't fetch profiles (returns 0 results)
-- The API uses service role but profiles might have RLS blocking it
-- Solution: Grant explicit SELECT permission to service_role

-- Check existing policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Grant service_role explicit SELECT on profiles
GRANT SELECT ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO authenticated;

-- Create policy for public read access to basic profile info
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Verify the grant
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='profiles' 
  AND grantee IN ('service_role', 'authenticated', 'anon');

SELECT '✅ Profiles RLS fixed - leaderboard should now show user names' as status;

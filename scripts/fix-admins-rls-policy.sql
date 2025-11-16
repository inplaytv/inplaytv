-- ===================================================================
-- FIX INFINITE RECURSION IN ADMINS TABLE RLS POLICY
-- Run this in Supabase Dashboard SQL Editor
-- ===================================================================

-- STEP 1: Temporarily disable RLS on admins to break the recursion
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all existing policies on admins table
DROP POLICY IF EXISTS "admins_select" ON public.admins;
DROP POLICY IF EXISTS "admins_insert" ON public.admins;
DROP POLICY IF EXISTS "admins_update" ON public.admins;
DROP POLICY IF EXISTS "admins_delete" ON public.admins;
DROP POLICY IF EXISTS "Allow admins full access" ON public.admins;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.admins;
DROP POLICY IF EXISTS "admins_select_simple" ON public.admins;
DROP POLICY IF EXISTS "admins_service_only" ON public.admins;

-- STEP 3: Re-enable RLS but leave policies simple
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create simple non-recursive policies
-- Allow all authenticated users to read admins (no subquery, no recursion)
CREATE POLICY "admins_read_all"
ON public.admins
FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify
CREATE POLICY "admins_modify_service"
ON public.admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 5: Verify the fix
SELECT 
  tablename, 
  policyname, 
  cmd,
  qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'admins'
ORDER BY policyname;

SELECT 'Admins table RLS policies fixed - no more recursion' AS status;

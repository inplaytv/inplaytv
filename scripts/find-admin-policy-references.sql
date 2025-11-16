-- ===================================================================
-- FIND ALL POLICIES THAT REFERENCE THE ADMINS TABLE
-- This will help us identify which policies are causing the recursion
-- ===================================================================

-- Check all policies across all tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE qual::text LIKE '%admins%' 
   OR with_check::text LIKE '%admins%'
ORDER BY tablename, policyname;

-- ===================================================================
-- DIAGNOSE THE 25 WARNINGS
-- ===================================================================

-- Common Supabase warnings include:
-- 1. Tables accessible to anon role
-- 2. Policies that might be too permissive
-- 3. Functions with SECURITY DEFINER
-- 4. Missing indexes on foreign keys
-- 5. Large tables without proper indexing

-- Check 1: Functions with SECURITY DEFINER
SELECT 
  '⚠️ Function with SECURITY DEFINER' as warning_type,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER
ORDER BY p.proname;

-- Check 2: Tables/Views accessible to anon role via grants
SELECT 
  '⚠️ Accessible to anon role' as warning_type,
  schemaname,
  tablename,
  'SELECT' as privilege
FROM pg_tables t
WHERE schemaname = 'public'
  AND has_table_privilege('anon', schemaname || '.' || tablename, 'SELECT')
ORDER BY tablename;

-- Check 3: Foreign keys without indexes
SELECT
  '⚠️ Foreign key without index' as warning_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  )
ORDER BY tc.table_name;

-- Check 4: Policies with potential issues
SELECT 
  '⚠️ Policy check' as warning_type,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN 'anon' = ANY(roles) THEN 'Allows anonymous access'
    WHEN qual IS NULL THEN 'No USING clause'
    WHEN with_check IS NULL AND cmd IN ('INSERT', 'UPDATE', 'ALL') THEN 'No WITH CHECK clause'
    ELSE 'Review needed'
  END as issue
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    'anon' = ANY(roles)
    OR (qual IS NULL AND cmd != 'SELECT')
    OR (with_check IS NULL AND cmd IN ('INSERT', 'UPDATE', 'ALL'))
  )
ORDER BY tablename, policyname;

-- Summary count
SELECT 
  'Total potential issues found' as summary,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prosecdef = true) +
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND has_table_privilege('anon', schemaname || '.' || tablename, 'SELECT')) as count;

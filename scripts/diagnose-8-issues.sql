-- ===================================================================
-- DIAGNOSE THE REMAINING 8 SECURITY ISSUES
-- ===================================================================

-- Issue Type 1: Check for policies that allow anonymous (anon) access
SELECT 
  '⚠️ ISSUE: Anonymous Access Allowed' as warning,
  schemaname,
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND 'anon' = ANY(roles)
ORDER BY tablename;

-- Issue Type 2: Check for policies using USING clause without proper auth checks
SELECT 
  '⚠️ ISSUE: Potentially Weak Policy' as warning,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual IS NULL OR qual = 'true')
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
ORDER BY tablename;

-- Issue Type 3: Tables that need INSERT/UPDATE/DELETE policies
SELECT 
  t.tablename,
  COUNT(CASE WHEN p.cmd = 'SELECT' OR p.cmd = '*' THEN 1 END) as select_policies,
  COUNT(CASE WHEN p.cmd = 'INSERT' OR p.cmd = '*' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN p.cmd = 'UPDATE' OR p.cmd = '*' THEN 1 END) as update_policies,
  COUNT(CASE WHEN p.cmd = 'DELETE' OR p.cmd = '*' THEN 1 END) as delete_policies,
  CASE 
    WHEN COUNT(CASE WHEN p.cmd = 'INSERT' OR p.cmd = '*' THEN 1 END) = 0 THEN '⚠️ Missing INSERT policy'
    WHEN COUNT(CASE WHEN p.cmd = 'UPDATE' OR p.cmd = '*' THEN 1 END) = 0 THEN '⚠️ Missing UPDATE policy'
    WHEN COUNT(CASE WHEN p.cmd = 'DELETE' OR p.cmd = '*' THEN 1 END) = 0 THEN '⚠️ Missing DELETE policy'
    ELSE '✅ OK'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND t.tablename NOT LIKE 'pg_%'
GROUP BY t.tablename
HAVING 
  COUNT(CASE WHEN p.cmd = 'INSERT' OR p.cmd = '*' THEN 1 END) = 0
  OR COUNT(CASE WHEN p.cmd = 'UPDATE' OR p.cmd = '*' THEN 1 END) = 0
  OR COUNT(CASE WHEN p.cmd = 'DELETE' OR p.cmd = '*' THEN 1 END) = 0
ORDER BY t.tablename;

-- Summary of all policies
SELECT 
  tablename,
  policyname,
  CASE cmd
    WHEN '*' THEN 'ALL'
    ELSE cmd::text
  END as operation,
  CASE 
    WHEN 'anon' = ANY(roles) THEN '⚠️ ANON ACCESS'
    WHEN 'authenticated' = ANY(roles) THEN 'Authenticated'
    ELSE roles[1]::text
  END as role_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

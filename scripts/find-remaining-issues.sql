-- ===================================================================
-- FIND THE REMAINING 8 SECURITY ISSUES
-- ===================================================================

-- Check which tables still need policies
SELECT 
  t.tablename,
  'Missing policies' as issue,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND t.tablename NOT LIKE 'pg_%'
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- Check all tables and their policy counts
SELECT 
  t.tablename,
  t.rowsecurity as has_rls,
  COUNT(p.policyname) as policy_count,
  CASE 
    WHEN t.rowsecurity = false THEN '❌ RLS Disabled'
    WHEN COUNT(p.policyname) = 0 THEN '⚠️ No Policies'
    ELSE '✅ Has ' || COUNT(p.policyname) || ' policies'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity, policy_count, t.tablename;

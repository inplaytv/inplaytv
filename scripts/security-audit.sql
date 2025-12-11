-- ===================================================================
-- SECURITY AUDIT - Check all tables for RLS and policies
-- ===================================================================

-- Check which tables have RLS disabled (SECURITY RISK!)
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS DISABLED - SECURITY RISK!'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- Check which tables have NO policies defined (even if RLS is enabled)
SELECT 
  t.tablename,
  CASE 
    WHEN COUNT(p.policyname) = 0 THEN '❌ NO POLICIES - SECURITY RISK!'
    ELSE '✅ Has ' || COUNT(p.policyname) || ' policies'
  END as policy_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename
ORDER BY COUNT(p.policyname), t.tablename;

-- List all existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN '*' THEN 'ALL'
    ELSE cmd::text
  END as applies_to,
  CASE roles[1]
    WHEN 'public' THEN 'Public'
    ELSE roles[1]::text
  END as role
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for anonymous access (public role) policies
SELECT 
  tablename,
  policyname,
  'WARNING: Allows anonymous access' as security_note
FROM pg_policies
WHERE schemaname = 'public' 
  AND 'public' = ANY(roles)
ORDER BY tablename;

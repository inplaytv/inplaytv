-- ===================================================================
-- FIX LAST 3 WARNINGS
-- ===================================================================

-- WARNING 1 & 2: Materialized views accessible to anon/authenticated roles
-- Solution: Revoke access from anon and add RLS-style access control

-- Revoke anon access from materialized views (treat as tables)
REVOKE ALL ON TABLE public.player_sg_averages FROM anon;
REVOKE ALL ON TABLE public.player_sg_averages FROM authenticated;

REVOKE ALL ON TABLE public.player_course_fit_scores FROM anon;
REVOKE ALL ON TABLE public.player_course_fit_scores FROM authenticated;

-- Grant controlled access only to authenticated users
GRANT SELECT ON TABLE public.player_sg_averages TO authenticated;
GRANT SELECT ON TABLE public.player_course_fit_scores TO authenticated;

-- ===================================================================
-- WARNING 3: Leaked Password Protection
-- This must be enabled in the Supabase Dashboard
-- ===================================================================

-- Navigate to: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/settings/auth
-- Under "Password Requirements" section
-- Enable "Check passwords against HaveIBeenPwned API"

SELECT '⚠️ MANUAL STEP REQUIRED:' as warning;
SELECT 'Go to Auth Settings and enable "Leaked Password Protection"' as action;
SELECT 'URL: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/settings/auth' as link;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ Materialized view access fixed!' as status;

-- Check materialized view permissions
SELECT 
  schemaname,
  matviewname,
  has_table_privilege('anon', schemaname || '.' || matviewname, 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', schemaname || '.' || matviewname, 'SELECT') as auth_can_select
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname IN ('player_sg_averages', 'player_course_fit_scores');

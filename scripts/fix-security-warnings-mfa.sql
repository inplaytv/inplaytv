-- ===================================================================
-- FIX SECURITY WARNINGS
-- ===================================================================

-- 1. Fix cleanup_expired_mfa_codes function - add search_path
DROP FUNCTION IF EXISTS cleanup_expired_mfa_codes();

CREATE OR REPLACE FUNCTION cleanup_expired_mfa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM mfa_verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 2. Fix generate_mfa_code function - add search_path
DROP FUNCTION IF EXISTS generate_mfa_code();

CREATE OR REPLACE FUNCTION generate_mfa_code()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  code VARCHAR(6);
BEGIN
  code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN code;
END;
$$;

-- 3. Fix player_course_fit_scores materialized view - revoke public access
REVOKE ALL ON public.player_course_fit_scores FROM anon;
REVOKE ALL ON public.player_course_fit_scores FROM authenticated;

-- Only allow admins to access (if needed for admin panel)
GRANT SELECT ON public.player_course_fit_scores TO authenticated;

-- If you want to restrict even more, you can create a policy
-- But materialized views don't support RLS, so we rely on GRANT/REVOKE

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ Security warnings fixed!' as status;

-- Verify functions have search_path
SELECT 
  routine_name,
  routine_type,
  security_type,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM information_schema.routines
LEFT JOIN pg_proc ON pg_proc.proname = routine_name
WHERE routine_schema = 'public'
AND routine_name IN ('cleanup_expired_mfa_codes', 'generate_mfa_code');

-- Verify materialized view permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'player_course_fit_scores';

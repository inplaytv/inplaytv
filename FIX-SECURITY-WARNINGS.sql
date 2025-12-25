-- ===================================================================
-- FIX SUPABASE SECURITY WARNINGS
-- ===================================================================
-- This migration fixes 5 security warnings from Supabase linter:
-- 1-4. Function Search Path Mutable (4 functions)
-- 5. Leaked Password Protection (Auth setting - manual step required)
--
-- Date: 2024-12-24
-- ===================================================================

-- ===================================================================
-- SECURITY ISSUE: Function Search Path Mutable
-- ===================================================================
-- Problem: Functions without a fixed search_path can be vulnerable to
-- search path injection attacks. Setting search_path = '' ensures
-- all object references must be fully qualified.
--
-- Fix: Add "SET search_path = ''" to all affected functions
-- ===================================================================

-- ===================================================================
-- 1. FIX: notify_tee_times_available
-- ===================================================================

CREATE OR REPLACE FUNCTION notify_tee_times_available(
  p_tournament_id UUID,
  p_tournament_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- ✅ SECURITY FIX: Prevent search path injection
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO public.notifications (user_id, tournament_id, type, title, message, link)
  SELECT 
    p.id,
    p_tournament_id,
    'tee_times_available',
    '⏰ Tee Times Available',
    'Tee times are now available for ' || p_tournament_name || '. Competition registration times have been updated.',
    '/tournaments/' || (SELECT slug FROM public.tournaments WHERE id = p_tournament_id)
  FROM public.profiles p
  JOIN public.notification_preferences np ON np.user_id = p.id
  WHERE np.tee_times_available = TRUE
    AND p.onboarding_complete = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION notify_tee_times_available IS 
'Creates notifications when tee times become available for a tournament. Search path secured.';

-- ===================================================================
-- 2. FIX: notify_registration_closing
-- ===================================================================

CREATE OR REPLACE FUNCTION notify_registration_closing(
  p_competition_id UUID,
  p_competition_name TEXT,
  p_tournament_name TEXT,
  p_closes_at TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- ✅ SECURITY FIX: Prevent search path injection
AS $$
DECLARE
  v_count INTEGER := 0;
  v_tournament_slug TEXT;
BEGIN
  -- Get tournament slug
  SELECT slug INTO v_tournament_slug
  FROM public.tournaments t
  JOIN public.tournament_competitions tc ON tc.tournament_id = t.id
  WHERE tc.id = p_competition_id;

  -- Only notify users who haven't entered yet and want these notifications
  INSERT INTO public.notifications (user_id, tournament_id, competition_id, type, title, message, link)
  SELECT 
    p.id,
    tc.tournament_id,
    p_competition_id,
    'registration_closing',
    '⚠️ Registration Closing Soon',
    p_competition_name || ' registration closes in ' || 
    CASE 
      WHEN EXTRACT(EPOCH FROM (p_closes_at - NOW())) / 3600 < 1 
      THEN ROUND(EXTRACT(EPOCH FROM (p_closes_at - NOW())) / 60) || ' minutes'
      ELSE ROUND(EXTRACT(EPOCH FROM (p_closes_at - NOW())) / 3600) || ' hours'
    END,
    '/tournaments/' || v_tournament_slug
  FROM public.profiles p
  JOIN public.notification_preferences np ON np.user_id = p.id
  JOIN public.tournament_competitions tc ON tc.id = p_competition_id
  WHERE np.registration_closing = TRUE
    AND p.onboarding_complete = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM public.competition_entries ce
      WHERE ce.competition_id = p_competition_id
        AND ce.user_id = p.id
    );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION notify_registration_closing IS 
'Creates notifications when competition registration is closing soon. Search path secured.';

-- ===================================================================
-- 3. FIX: log_tournament_sync
-- ===================================================================

CREATE OR REPLACE FUNCTION log_tournament_sync(
  p_tournament_id UUID,
  p_source TEXT,
  p_event_name TEXT,
  p_golfers_count INTEGER,
  p_replace_mode BOOLEAN,
  p_tour_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = ''  -- ✅ SECURITY FIX: Prevent search path injection
AS $$
DECLARE
  v_before_count INTEGER;
  v_sync_id UUID;
BEGIN
  -- Get current golfer count
  SELECT COUNT(*) INTO v_before_count
  FROM public.tournament_golfers
  WHERE tournament_id = p_tournament_id;
  
  -- Insert sync record
  INSERT INTO public.tournament_sync_history (
    tournament_id,
    source,
    event_name_returned,
    golfers_in_response,
    golfers_before,
    replace_mode,
    tour_parameter
  ) VALUES (
    p_tournament_id,
    p_source,
    p_event_name,
    p_golfers_count,
    v_before_count,
    p_replace_mode,
    p_tour_param
  )
  RETURNING id INTO v_sync_id;
  
  RETURN v_sync_id;
END;
$$;

COMMENT ON FUNCTION log_tournament_sync IS 
'Logs the start of a tournament golfer sync operation. Search path secured.';

-- ===================================================================
-- 4. FIX: complete_tournament_sync
-- ===================================================================

CREATE OR REPLACE FUNCTION complete_tournament_sync(
  p_sync_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''  -- ✅ SECURITY FIX: Prevent search path injection
AS $$
DECLARE
  v_tournament_id UUID;
  v_after_count INTEGER;
BEGIN
  -- Get tournament ID from sync record
  SELECT tournament_id INTO v_tournament_id
  FROM public.tournament_sync_history
  WHERE id = p_sync_id;
  
  -- Get current golfer count
  SELECT COUNT(*) INTO v_after_count
  FROM public.tournament_golfers
  WHERE tournament_id = v_tournament_id;
  
  -- Update sync record
  UPDATE public.tournament_sync_history
  SET 
    golfers_after = v_after_count,
    success = p_success,
    error_message = p_error_message
  WHERE id = p_sync_id;
END;
$$;

COMMENT ON FUNCTION complete_tournament_sync IS 
'Completes a tournament sync log with final counts and status. Search path secured.';

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Verify all functions have search_path set
SELECT 
  '✅ Function Security Check' as status,
  p.proname as function_name,
  CASE 
    WHEN pg_catalog.array_to_string(p.proconfig, ', ') LIKE '%search_path%' 
    THEN '✅ SECURED'
    ELSE '❌ VULNERABLE'
  END as search_path_status,
  pg_catalog.array_to_string(p.proconfig, ', ') as settings
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'notify_tee_times_available',
    'notify_registration_closing', 
    'log_tournament_sync',
    'complete_tournament_sync'
  )
ORDER BY p.proname;

-- ===================================================================
-- 5. LEAKED PASSWORD PROTECTION - MANUAL STEP REQUIRED
-- ===================================================================
-- 
-- ⚠️  WARNING: This cannot be fixed via SQL - requires Supabase Dashboard
--
-- STEPS TO ENABLE:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Authentication
-- 3. Click on "Attack Protection" in the left menu
-- 4. Find "Leaked Password Protection" setting
-- 5. Toggle ON to enable HaveIBeenPwned.org integration
-- 6. Click "Save"
--
-- WHAT IT DOES:
-- - Checks passwords against HaveIBeenPwned.org database
-- - Prevents users from using compromised passwords
-- - Enhances account security significantly
-- - No performance impact (async check)
--
-- BENEFITS:
-- ✅ Prevents use of known leaked passwords
-- ✅ Protects users from credential stuffing attacks
-- ✅ Industry best practice for auth security
-- ✅ Free service with privacy protection
--
-- ===================================================================

SELECT 
  '⚠️  MANUAL ACTION REQUIRED' as alert,
  'Enable Leaked Password Protection in Supabase Auth Settings' as action,
  'Dashboard → Authentication → Attack Protection' as location;

-- ===================================================================
-- SUMMARY
-- ===================================================================

SELECT 
  '✅ Migration Complete' as status,
  '4 functions secured with search_path' as fixed,
  '1 manual step required (Auth settings)' as remaining;

-- ===================================================================
-- NOTES
-- ===================================================================
-- 
-- SEARCH PATH SECURITY:
-- - Setting search_path = '' requires fully qualified table names
-- - Prevents malicious schema injection attacks
-- - Required for SECURITY DEFINER functions
-- - All references changed to "public.table_name" format
--
-- LEAKED PASSWORD PROTECTION:
-- - Must be enabled manually in Supabase Dashboard
-- - Cannot be automated via SQL or API
-- - Highly recommended for production security
-- - Zero-knowledge privacy preserving (uses k-Anonymity)
--
-- TESTING:
-- - All functions should work identically after this fix
-- - No functional changes, only security hardening
-- - Test notification and sync operations after applying
--
-- ===================================================================

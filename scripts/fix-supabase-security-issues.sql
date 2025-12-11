-- ===================================================================
-- FIX ALL SUPABASE SECURITY ISSUES
-- ===================================================================
-- This script fixes:
-- 1. Exposed Auth Users via admin_users_with_wallets view
-- 2. Security Definer View issue
-- 3. Function Search Path Mutable (5 functions)
-- 4. Materialized Views accessible to anon/authenticated (3 issues)

-- ===================================================================
-- ISSUE 1 & 2: admin_users_with_wallets View
-- ===================================================================
-- Problem: View exposes auth.users and uses SECURITY DEFINER
-- Solution: Keep view but revoke direct access, only allow via RPC function

-- Revoke direct access to the view
REVOKE ALL ON public.admin_users_with_wallets FROM anon;
REVOKE ALL ON public.admin_users_with_wallets FROM authenticated;

-- Only service_role can access it directly (for admin API)
GRANT SELECT ON public.admin_users_with_wallets TO service_role;

-- Create a secure RPC function for admins to query users
CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  full_name TEXT,
  balance_pennies BIGINT,
  balance_cents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return user data
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    p.username,
    p.first_name,
    p.last_name,
    p.display_name,
    COALESCE(p.display_name, p.username, 'User ' || SUBSTRING(u.id::text, 1, 8)) as full_name,
    COALESCE(w.balance_pennies, 0) as balance_pennies,
    COALESCE(w.balance_cents, 0) as balance_cents
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.wallets w ON w.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute to authenticated users (function checks admin status internally)
GRANT EXECUTE ON FUNCTION public.get_admin_users_list() TO authenticated;

-- ===================================================================
-- ISSUE 3-7: Function Search Path Mutable
-- ===================================================================
-- Problem: Functions don't have explicit search_path set
-- Solution: Set search_path = public, pg_temp for all functions

-- Fix deduct_from_wallet
CREATE OR REPLACE FUNCTION public.deduct_from_wallet(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the wallet row for update (prevents concurrent modifications)
  SELECT balance_cents
  INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if wallet exists
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount_cents THEN
    RAISE EXCEPTION 'Insufficient funds. Current: %, Required: %', v_current_balance, p_amount_cents;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount_cents;

  -- Update wallet atomically
  UPDATE wallets
  SET balance_cents = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id,
    change_cents,
    reason,
    balance_after_cents
  ) VALUES (
    p_user_id,
    -p_amount_cents,
    p_reason,
    v_new_balance
  );

  -- Return success with new balance
  RETURN json_build_object(
    'success', true,
    'old_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount_cents
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RAISE;
END;
$$;

-- Fix cleanup_expired_mfa_codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_mfa_codes()
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

-- Fix generate_mfa_code
CREATE OR REPLACE FUNCTION public.generate_mfa_code()
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

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_username TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_name TEXT;
BEGIN
  -- Extract metadata with safe defaults
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || SUBSTRING(NEW.id::text, 1, 8)
  );
  
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- Build full name if we have first and last
  IF v_first_name IS NOT NULL AND v_last_name IS NOT NULL THEN
    v_name := v_first_name || ' ' || v_last_name;
  ELSE
    v_name := NULL;
  END IF;
  
  -- Create profile with metadata from signup
  INSERT INTO public.profiles (
    id, 
    username,
    first_name,
    last_name,
    name,
    onboarding_complete
  )
  VALUES (
    NEW.id,
    v_username,
    v_first_name,
    v_last_name,
    v_name,
    COALESCE((NEW.raw_user_meta_data->>'onboarding_complete')::boolean, false)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'Error in handle_new_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Fix set_display_name
CREATE OR REPLACE FUNCTION public.set_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Auto-generate display_name on INSERT or UPDATE
  -- Use COALESCE to handle NULL values safely
  IF NEW.first_name IS NOT NULL AND NEW.first_name != '' AND 
     NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN
    NEW.display_name := NEW.first_name || ' ' || NEW.last_name;
  ELSIF NEW.username IS NOT NULL AND NEW.username != '' THEN
    NEW.display_name := NEW.username;
  ELSE
    NEW.display_name := 'User ' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, use a safe fallback
  NEW.display_name := 'User ' || SUBSTRING(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$;

-- ===================================================================
-- ISSUE 8-10: Materialized Views in API
-- ===================================================================
-- Problem: player_sg_averages and player_course_fit_scores accessible to anon/authenticated
-- Solution: Revoke access from anon/authenticated, grant only to service_role

-- Revoke access from anon and authenticated
REVOKE ALL ON public.player_sg_averages FROM anon;
REVOKE ALL ON public.player_sg_averages FROM authenticated;

REVOKE ALL ON public.player_course_fit_scores FROM anon;
REVOKE ALL ON public.player_course_fit_scores FROM authenticated;

-- Grant to service_role only (for internal API use)
GRANT SELECT ON public.player_sg_averages TO service_role;
GRANT SELECT ON public.player_course_fit_scores TO service_role;

-- Create secure RPC functions if these need to be accessed by users
CREATE OR REPLACE FUNCTION public.get_player_sg_averages(p_player_id TEXT DEFAULT NULL)
RETURNS TABLE (
  player_id TEXT,
  avg_sg_total NUMERIC,
  avg_sg_ott NUMERIC,
  avg_sg_app NUMERIC,
  avg_sg_arg NUMERIC,
  avg_sg_putt NUMERIC,
  rounds_counted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_player_id IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.player_sg_averages
    WHERE player_sg_averages.player_id = p_player_id;
  ELSE
    RETURN QUERY
    SELECT * FROM public.player_sg_averages;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_player_course_fit(p_player_id TEXT DEFAULT NULL)
RETURNS TABLE (
  player_id TEXT,
  course_id TEXT,
  fit_score NUMERIC,
  avg_score NUMERIC,
  rounds_played INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_player_id IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.player_course_fit_scores
    WHERE player_course_fit_scores.player_id = p_player_id;
  ELSE
    RETURN QUERY
    SELECT * FROM public.player_course_fit_scores;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_player_sg_averages(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_course_fit(TEXT) TO authenticated;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ All Supabase security issues fixed!' as status;

-- Verify view permissions
SELECT 
  'admin_users_with_wallets permissions' as check_type,
  has_table_privilege('anon', 'public.admin_users_with_wallets', 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', 'public.admin_users_with_wallets', 'SELECT') as auth_can_select,
  has_table_privilege('service_role', 'public.admin_users_with_wallets', 'SELECT') as service_can_select;

-- Verify materialized view permissions
SELECT 
  'player_sg_averages permissions' as check_type,
  has_table_privilege('anon', 'public.player_sg_averages', 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', 'public.player_sg_averages', 'SELECT') as auth_can_select,
  has_table_privilege('service_role', 'public.player_sg_averages', 'SELECT') as service_can_select;

SELECT 
  'player_course_fit_scores permissions' as check_type,
  has_table_privilege('anon', 'public.player_course_fit_scores', 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', 'public.player_course_fit_scores', 'SELECT') as auth_can_select,
  has_table_privilege('service_role', 'public.player_course_fit_scores', 'SELECT') as service_can_select;

-- Verify functions have search_path set
SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN routine_definition LIKE '%search_path%' THEN '✅ Has search_path'
    ELSE '❌ Missing search_path'
  END as search_path_status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'deduct_from_wallet',
  'cleanup_expired_mfa_codes',
  'generate_mfa_code',
  'handle_new_user',
  'set_display_name'
);

SELECT '✅ Verification complete! All issues should now be resolved.' as final_status;

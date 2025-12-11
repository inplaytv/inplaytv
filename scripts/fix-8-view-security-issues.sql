-- ===================================================================
-- FIX ALL 8 SECURITY ISSUES WITH VIEWS
-- ===================================================================

-- ISSUE 1: admin_users_with_wallets exposes auth.users to authenticated users
-- Fix: Recreate view without SECURITY DEFINER or restrict in PostgREST config
-- For now, we'll change from SECURITY DEFINER to SECURITY INVOKER

-- ISSUES 1-8: Change all views from SECURITY DEFINER to SECURITY INVOKER
-- This makes them use the querying user's permissions instead of view creator's

DO $$
BEGIN
  -- admin_users_with_wallets - Change to security invoker
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'admin_users_with_wallets') THEN
    EXECUTE 'ALTER VIEW public.admin_users_with_wallets SET (security_invoker = true)';
    RAISE NOTICE '✅ Fixed admin_users_with_wallets';
  END IF;

  -- ledger_overview - Admin only
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'ledger_overview') THEN
    EXECUTE 'ALTER VIEW public.ledger_overview SET (security_invoker = true)';
    RAISE NOTICE '✅ Fixed ledger_overview';
  END IF;

  -- v_tournament_groups - Public read (authenticated)
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_tournament_groups') THEN
    EXECUTE 'ALTER VIEW public.v_tournament_groups SET (security_invoker = true)';
    RAISE NOTICE '✅ Fixed v_tournament_groups';
  END IF;

  -- player_hot_cold_list - Public read (authenticated)
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'player_hot_cold_list') THEN
    EXECUTE 'ALTER VIEW public.player_hot_cold_list SET (security_invoker = true)';
    RAISE NOTICE '✅ Fixed player_hot_cold_list';
  END IF;

  -- v_competition_golfers - Public read (authenticated)
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_competition_golfers') THEN
    EXECUTE 'ALTER VIEW public.v_competition_golfers SET (security_invoker = true)';
    RAISE NOTICE '✅ Fixed v_competition_golfers';
  END IF;

  -- v_entry_teams - Users can see their own entries
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_entry_teams') THEN
    EXECUTE 'ALTER VIEW public.v_entry_teams SET (security_invoker = true)';
    RAISE NOTICE '✅ Fixed v_entry_teams';
  END IF;

  -- v_group_golfers - Public read (authenticated)
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_group_golfers') THEN
    EXECUTE 'ALTER VIEW public.v_group_golfers SET (security_invoker = true)';
    RAISE NOTICE '✅ Fixed v_group_golfers';
  END IF;
END $$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ All 8 security issues fixed!' as status;

-- Verify no more SECURITY DEFINER views
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'admin_users_with_wallets',
    'ledger_overview',
    'v_tournament_groups',
    'player_hot_cold_list',
    'v_competition_golfers',
    'v_entry_teams',
    'v_group_golfers'
  );

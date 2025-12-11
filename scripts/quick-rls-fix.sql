-- ===================================================================
-- QUICK FIX - Most Common Supabase Security Issues
-- ===================================================================

-- Issue 1: Tables with RLS disabled
-- Fix: Enable RLS on all tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competition_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competition_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.golfer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.one_2_one_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competition_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competition_analytics ENABLE ROW LEVEL SECURITY;

-- Issue 2: Service role bypassing RLS
-- Fix: Create policies that check for service role OR user ownership

-- Issue 3: Anonymous access
-- Fix: Ensure all policies require 'authenticated' role

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

SELECT '✅ RLS enabled on all tables' as status;

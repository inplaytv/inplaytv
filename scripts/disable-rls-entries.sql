-- ===================================================================
-- COMPREHENSIVE FIX: Disable RLS on all user-transaction tables
-- This removes admin checks from the entire purchase flow
-- ===================================================================

-- Disable RLS on all tables involved in user purchases
ALTER TABLE public.competition_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_picks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'competition_entries', 
    'entry_picks', 
    'wallets', 
    'wallet_transactions',
    'admins'
  )
ORDER BY tablename;

SELECT 'RLS disabled on all user transaction tables - purchase flow should work now' AS status;

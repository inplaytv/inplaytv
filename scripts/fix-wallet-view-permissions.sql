-- ===================================================================
-- FIX WALLET VIEW PERMISSIONS FOR ADMIN ACCESS
-- ===================================================================
-- Problem: admin_users_with_wallets view was changed to security_invoker = true
-- This causes "permission denied" when admin client queries it
-- Solution: Change back to security_invoker = false so it uses creator's permissions

-- Fix the view security setting
ALTER VIEW public.admin_users_with_wallets SET (security_invoker = false);

-- Verify the fix
SELECT 
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'admin_users_with_wallets';

-- Test query
SELECT 
  '✅ Wallet view permissions fixed!' as status,
  COUNT(*) as user_count 
FROM public.admin_users_with_wallets;

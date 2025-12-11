-- ===================================================================
-- CREATE ADMIN_USERS_WITH_WALLETS VIEW
-- ===================================================================
-- This view combines users, profiles, and wallet data for admin panel

-- Drop view if exists
DROP VIEW IF EXISTS public.admin_users_with_wallets;

-- Create the view
CREATE VIEW public.admin_users_with_wallets AS
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

-- Grant access to authenticated users (admins will check via RLS)
GRANT SELECT ON public.admin_users_with_wallets TO authenticated;
GRANT SELECT ON public.admin_users_with_wallets TO service_role;

-- Show success
SELECT 
  '✅ admin_users_with_wallets view created!' as status,
  COUNT(*) as total_users
FROM public.admin_users_with_wallets;

-- Show sample data
SELECT 
  id,
  email,
  username,
  full_name,
  balance_pennies,
  balance_cents,
  created_at
FROM public.admin_users_with_wallets
LIMIT 5;

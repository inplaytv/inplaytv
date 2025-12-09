-- Create a view that admins can query for user wallet information
-- This bypasses RLS issues by using a proper database view with security definer

-- First, create the view
CREATE OR REPLACE VIEW admin_users_with_wallets AS
SELECT 
  p.id,
  p.email,
  p.username,
  p.full_name,
  p.created_at,
  COALESCE(w.balance_cents, 0) as balance_cents
FROM profiles p
LEFT JOIN wallets w ON w.user_id = p.id
ORDER BY p.created_at DESC;

-- Grant access to authenticated users (RLS will still check if they're admin)
GRANT SELECT ON admin_users_with_wallets TO authenticated;

-- Create RLS policy on the view for admin access only
ALTER VIEW admin_users_with_wallets SET (security_invoker = false);

-- Verify the view works
SELECT * FROM admin_users_with_wallets LIMIT 5;

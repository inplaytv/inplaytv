-- ===================================================================
-- MARK ALL EXISTING USERS AS EMAIL VERIFIED
-- ===================================================================
-- This marks all current users as verified so they can login
-- New users will be auto-verified since email confirmation is disabled

-- Update auth.users to mark emails as confirmed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Show results
SELECT 
  '✅ All users marked as verified!' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as verified_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unverified_users
FROM auth.users;

-- Show sample of users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

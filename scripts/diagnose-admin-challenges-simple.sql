-- Step 1: Find your admin user ID
SELECT 
  au.id, 
  au.email,
  p.username
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email ILIKE '%admin%'
LIMIT 5;

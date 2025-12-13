-- Check if is_admin function exists
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'is_admin'
  AND n.nspname = 'public';

-- Alternative: Check admin_users table
SELECT * FROM admin_users LIMIT 5;

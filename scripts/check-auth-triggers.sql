-- ===================================================================
-- CHECK FOR AUTH TRIGGERS
-- ===================================================================
-- Check if there's an automatic trigger creating profiles on user signup

-- Check for triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Check for handle_new_user function
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname LIKE '%user%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

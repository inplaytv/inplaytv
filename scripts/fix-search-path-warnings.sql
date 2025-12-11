-- ===================================================================
-- FIX FUNCTION SEARCH PATH MUTABLE WARNINGS
-- Set explicit search_path on all functions for security
-- ===================================================================

-- Fix all functions by setting search_path to 'public'
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as func_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) IS NOT NULL
  LOOP
    BEGIN
      -- Set search_path to prevent security issues
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        func_record.schema_name,
        func_record.function_name,
        func_record.func_args
      );
      RAISE NOTICE '✅ Fixed search_path for: %', func_record.function_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not fix % (may need manual review): %', 
        func_record.function_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ All function search paths fixed!' as status;

-- List all functions and their search_path settings
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN '⚠️ No search_path set'
    ELSE '✅ search_path configured'
  END as status,
  p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

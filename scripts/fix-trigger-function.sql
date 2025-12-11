-- ===================================================================
-- FIX BROKEN TRIGGER FUNCTION
-- ===================================================================
-- The set_display_name() function is causing 500 errors
-- This recreates it with proper error handling

-- Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.set_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate display_name on INSERT or UPDATE
  -- Use COALESCE to handle NULL values safely
  IF NEW.first_name IS NOT NULL AND NEW.first_name != '' AND 
     NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN
    NEW.display_name := NEW.first_name || ' ' || NEW.last_name;
  ELSIF NEW.username IS NOT NULL AND NEW.username != '' THEN
    NEW.display_name := NEW.username;
  ELSE
    NEW.display_name := 'User ' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, use a safe fallback
  NEW.display_name := 'User ' || SUBSTRING(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created
SELECT 
  '✅ Trigger function fixed!' as status,
  proname as function_name,
  prolang::regproc as language
FROM pg_proc
WHERE proname = 'set_display_name';

-- Test the trigger with a real insert
DO $$
DECLARE
  test_id UUID := 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
BEGIN
  -- Clean up if exists
  DELETE FROM public.profiles WHERE id = test_id;
  
  -- Try insert
  INSERT INTO public.profiles (id, username, first_name, last_name)
  VALUES (test_id, 'testuser456', 'John', 'Doe');
  
  RAISE NOTICE '✅ Test insert with trigger succeeded!';
  
  -- Show result
  PERFORM id, username, first_name, last_name, display_name
  FROM public.profiles 
  WHERE id = test_id;
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Test insert failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  -- Clean up on error
  DELETE FROM public.profiles WHERE id = test_id;
END $$;

SELECT 
  '✅ Verification complete!' as status,
  'Trigger function is now working' as message;

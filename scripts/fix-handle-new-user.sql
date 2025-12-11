-- ===================================================================
-- FIX HANDLE_NEW_USER TRIGGER
-- ===================================================================
-- The handle_new_user trigger auto-creates profiles but doesn't include metadata
-- This updates it to pull username and names from auth.users metadata

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function to handle metadata safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_name TEXT;
BEGIN
  -- Extract metadata with safe defaults
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || SUBSTRING(NEW.id::text, 1, 8)
  );
  
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- Build full name if we have first and last
  IF v_first_name IS NOT NULL AND v_last_name IS NOT NULL THEN
    v_name := v_first_name || ' ' || v_last_name;
  ELSE
    v_name := NULL;
  END IF;
  
  -- Create profile with metadata from signup
  INSERT INTO public.profiles (
    id, 
    username,
    first_name,
    last_name,
    name,
    onboarding_complete
  )
  VALUES (
    NEW.id,
    v_username,
    v_first_name,
    v_last_name,
    v_name,
    COALESCE((NEW.raw_user_meta_data->>'onboarding_complete')::boolean, false)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'Error in handle_new_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ handle_new_user trigger updated!' as status;

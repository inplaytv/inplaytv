-- ===================================================================
-- EMERGENCY FIX FOR SIGNUP ERRORS
-- ===================================================================
-- This fixes RLS policies to allow profile creation during signup
-- and fixes the display_name column issue

-- Step 0: Fix RLS policies to allow signup
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);  -- Remove TO authenticated to allow anon inserts during signup

-- Step 1: Drop the GENERATED column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN display_name CASCADE;
    RAISE NOTICE '✅ Dropped display_name column';
  END IF;
END $$;

-- Step 2: Add display_name as a regular TEXT column
ALTER TABLE public.profiles 
ADD COLUMN display_name TEXT;

-- Step 3: Create a trigger function to auto-populate display_name
CREATE OR REPLACE FUNCTION public.set_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate display_name on INSERT or UPDATE
  NEW.display_name := COALESCE(
    CASE 
      WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL 
      THEN NEW.first_name || ' ' || NEW.last_name
      ELSE NEW.username
    END,
    'User ' || SUBSTRING(NEW.id::text, 1, 8)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS trigger_set_display_name ON public.profiles;
CREATE TRIGGER trigger_set_display_name
  BEFORE INSERT OR UPDATE OF first_name, last_name, username
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_display_name();

-- Step 5: Backfill existing records
UPDATE public.profiles
SET username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8))
WHERE username IS NULL;

-- Force trigger to run on all existing rows
UPDATE public.profiles
SET first_name = COALESCE(first_name, first_name);

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Show results
SELECT 
  '✅ Signup fix applied!' as status,
  id,
  username,
  first_name,
  last_name,
  display_name
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

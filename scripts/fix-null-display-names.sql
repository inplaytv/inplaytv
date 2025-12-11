-- ===================================================================
-- FIX DISPLAY_NAME COLUMN (It's NULL even with data)
-- ===================================================================

-- The issue: display_name is NULL even when first_name/username exist
-- Cause: The GENERATED column formula might have issues or wasn't created properly

-- Step 1: Drop the broken display_name column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name CASCADE;

-- Step 2: Recreate it with a simpler, more robust formula
ALTER TABLE public.profiles 
ADD COLUMN display_name TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != ''
    THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL AND first_name != ''
    THEN first_name
    WHEN username IS NOT NULL AND username != ''
    THEN username
    ELSE 'User ' || SUBSTRING(id::text, 1, 8)
  END
) STORED;

-- Step 3: Ensure terry has a username or first_name
-- Update terry's profile to have a first_name from email
UPDATE public.profiles
SET first_name = SPLIT_PART(
  (SELECT email FROM auth.users WHERE id = profiles.id),
  '@',
  1
)
WHERE first_name IS NULL 
  AND username IS NULL
  AND id IN (
    SELECT id FROM auth.users WHERE email LIKE '%terry%'
  );

-- Step 4: Recreate index
DROP INDEX IF EXISTS idx_profiles_display_name;
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);

-- Step 5: Verify the fix
SELECT 
  username,
  first_name,
  last_name,
  display_name,
  (SELECT email FROM auth.users WHERE id = profiles.id) as email,
  CASE 
    WHEN display_name IS NULL THEN '❌ STILL NULL'
    WHEN display_name LIKE 'User %' THEN '⚠️ Using fallback'
    ELSE '✅ HAS NAME'
  END as status
FROM public.profiles
ORDER BY created_at DESC;

-- Show counts
SELECT 
  COUNT(*) FILTER (WHERE display_name IS NOT NULL AND display_name NOT LIKE 'User %') as "✅ Has display name",
  COUNT(*) FILTER (WHERE display_name LIKE 'User %') as "⚠️ Fallback to User ID",
  COUNT(*) FILTER (WHERE display_name IS NULL) as "❌ NULL (broken)",
  COUNT(*) as "Total users"
FROM public.profiles;

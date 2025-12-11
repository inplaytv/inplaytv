-- ===================================================================
-- UPDATE EXISTING PROFILES WITH DISPLAY_NAME
-- ===================================================================
-- Force the display_name trigger to run on all existing profiles

-- Update all profiles to trigger the set_display_name function
UPDATE public.profiles
SET username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8))
WHERE username IS NULL OR username = '';

-- Force trigger to run by updating first_name (even if NULL)
UPDATE public.profiles
SET first_name = first_name;

-- Show updated profiles
SELECT 
  '✅ Display names updated!' as status,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE display_name IS NOT NULL) as profiles_with_display_name,
  COUNT(*) FILTER (WHERE display_name IS NULL) as profiles_missing_display_name
FROM public.profiles;

-- Show sample of profiles
SELECT 
  id,
  username,
  first_name,
  last_name,
  display_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

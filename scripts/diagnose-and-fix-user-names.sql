-- ===================================================================
-- DIAGNOSE USER NAMES NOT SHOWING
-- ===================================================================
-- Run this to check if display names are working correctly

-- 1. Check if columns exist
SELECT 
  column_name, 
  data_type,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('first_name', 'last_name', 'display_name', 'username', 'name')
ORDER BY ordinal_position;

-- 2. Check sample data from profiles
SELECT 
  id,
  username,
  first_name,
  last_name,
  display_name,
  name,
  created_at,
  CASE 
    WHEN display_name IS NULL THEN '❌ display_name is NULL'
    WHEN display_name = '' THEN '❌ display_name is empty'
    WHEN display_name LIKE 'User %' THEN '⚠️ Showing fallback User ID'
    WHEN first_name IS NOT NULL THEN '✅ Has first_name'
    WHEN username IS NOT NULL THEN '✅ Using username'
    ELSE '❌ No name data'
  END as status
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;

-- 3. Count users by name status
SELECT 
  COUNT(*) FILTER (WHERE display_name IS NOT NULL) as has_display_name,
  COUNT(*) FILTER (WHERE first_name IS NOT NULL) as has_first_name,
  COUNT(*) FILTER (WHERE last_name IS NOT NULL) as has_last_name,
  COUNT(*) FILTER (WHERE username IS NOT NULL) as has_username,
  COUNT(*) FILTER (WHERE display_name LIKE 'User %') as showing_user_id,
  COUNT(*) as total_profiles
FROM public.profiles;

-- 4. Show users that SHOULD have names but don't
SELECT 
  id,
  username,
  first_name,
  last_name,
  display_name,
  '⚠️ Has username but no first_name' as issue
FROM public.profiles
WHERE username IS NOT NULL 
  AND (first_name IS NULL OR first_name = '')
LIMIT 10;

-- ===================================================================
-- FIX: If display_name column doesn't exist or is broken
-- ===================================================================

-- Drop and recreate display_name as GENERATED column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name CASCADE;

-- Add it back as GENERATED
ALTER TABLE public.profiles 
ADD COLUMN display_name TEXT GENERATED ALWAYS AS (
  COALESCE(
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND first_name != '' AND last_name != ''
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL AND first_name != ''
      THEN first_name
      WHEN username IS NOT NULL AND username != ''
      THEN username
      ELSE NULL
    END,
    'User ' || SUBSTRING(id::text, 1, 8)
  )
) STORED;

-- Ensure first_name and last_name exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill first_name from username for all users who have username but no first_name
UPDATE public.profiles
SET first_name = username
WHERE username IS NOT NULL 
  AND username != ''
  AND (first_name IS NULL OR first_name = '');

-- Recreate indexes
DROP INDEX IF EXISTS idx_profiles_display_name;
DROP INDEX IF EXISTS idx_profiles_first_name;
DROP INDEX IF EXISTS idx_profiles_last_name;

CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX idx_profiles_last_name ON public.profiles(last_name);

-- ===================================================================
-- FINAL VERIFICATION
-- ===================================================================

SELECT '✅ User names fixed! Checking results...' as status;

-- Show updated profiles
SELECT 
  username,
  first_name,
  last_name,
  display_name,
  CASE 
    WHEN display_name IS NULL THEN '❌ NULL'
    WHEN display_name LIKE 'User %' THEN '⚠️ Fallback'
    ELSE '✅ Has name'
  END as status
FROM public.profiles
WHERE username IS NOT NULL
ORDER BY created_at DESC
LIMIT 15;

-- Show statistics
SELECT 
  COUNT(*) FILTER (WHERE display_name IS NOT NULL AND display_name NOT LIKE 'User %') as "✅ Users with names",
  COUNT(*) FILTER (WHERE display_name LIKE 'User %') as "⚠️ Showing User ID",
  COUNT(*) FILTER (WHERE display_name IS NULL) as "❌ NULL display_name",
  COUNT(*) as "Total users"
FROM public.profiles;

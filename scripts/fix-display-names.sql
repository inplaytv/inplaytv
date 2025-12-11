-- ===================================================================
-- FIX DISPLAY NAMES - Run this if names aren't showing
-- ===================================================================

-- First, check if display_name column exists and drop it if it's not GENERATED
DO $$ 
BEGIN
  -- Drop the column if it exists (we'll recreate it properly)
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;
END $$;

-- Add display_name as a GENERATED column
ALTER TABLE public.profiles 
ADD COLUMN display_name TEXT GENERATED ALWAYS AS (
  COALESCE(
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL 
      THEN first_name
      ELSE username
    END,
    'User ' || SUBSTRING(id::text, 1, 8)
  )
) STORED;

-- Ensure first_name and last_name columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill first_name from username for existing users
UPDATE public.profiles
SET first_name = username
WHERE username IS NOT NULL 
  AND (first_name IS NULL OR first_name = '');

-- Create/recreate indexes
DROP INDEX IF EXISTS idx_profiles_first_name;
DROP INDEX IF EXISTS idx_profiles_last_name;
DROP INDEX IF EXISTS idx_profiles_display_name;

CREATE INDEX idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);

-- Verify the results
SELECT '✅ Display names fixed! Here are some examples:' as status;

SELECT 
  username,
  first_name,
  last_name,
  display_name,
  CASE 
    WHEN display_name IS NULL THEN '❌ NULL'
    WHEN display_name LIKE 'User %' THEN '⚠️ Fallback to User ID'
    ELSE '✅ Has name'
  END as display_status
FROM public.profiles
ORDER BY created_at DESC
LIMIT 15;

-- Count how many users have names vs fallback
SELECT 
  COUNT(*) FILTER (WHERE first_name IS NOT NULL) as "Users with first_name",
  COUNT(*) FILTER (WHERE last_name IS NOT NULL) as "Users with last_name",
  COUNT(*) FILTER (WHERE display_name LIKE 'User %') as "Showing User ID fallback",
  COUNT(*) as "Total users"
FROM public.profiles;

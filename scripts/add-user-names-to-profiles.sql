-- ===================================================================
-- ADD USER NAMES TO PROFILES
-- ===================================================================
-- This migration adds proper name fields to profiles table
-- Run this in Supabase SQL Editor

-- Add name columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT GENERATED ALWAYS AS (
  COALESCE(
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      ELSE username
    END,
    'User ' || SUBSTRING(id::text, 1, 8)
  )
) STORED;

-- Create indexes for searching by name
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Update existing records that have username but no names
-- This sets first_name to username for existing users
UPDATE public.profiles
SET first_name = username
WHERE username IS NOT NULL 
  AND first_name IS NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.display_name IS 'Auto-generated display name: "First Last" or username or "User [id-prefix]"';

SELECT '✅ User names added to profiles successfully!' as status;

-- Show sample of updated profiles
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

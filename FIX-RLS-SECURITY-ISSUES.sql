-- ===================================================================
-- FIX SUPABASE RLS SECURITY ISSUES
-- ===================================================================
-- This migration enables Row Level Security on tables that were missing it
-- and adds appropriate security policies
--
-- Issues Fixed:
-- 1. RLS Disabled on public.tournament_sync_history
-- 2. RLS Disabled on public.settings (if exists)
--
-- Date: 2024-12-24
-- ===================================================================

-- ===================================================================
-- 1. FIX: tournament_sync_history RLS
-- ===================================================================

-- Enable RLS on tournament_sync_history
ALTER TABLE public.tournament_sync_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view sync history" ON tournament_sync_history;
DROP POLICY IF EXISTS "Admins can insert sync history" ON tournament_sync_history;
DROP POLICY IF EXISTS "Admins can update sync history" ON tournament_sync_history;

-- Policy: Only admins can view sync history
CREATE POLICY "Admins can view sync history"
ON public.tournament_sync_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- Policy: Only admins can insert sync records (used by sync APIs)
CREATE POLICY "Admins can insert sync history"
ON public.tournament_sync_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- Policy: Only admins can update sync records
CREATE POLICY "Admins can update sync history"
ON public.tournament_sync_history
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- ===================================================================
-- 2. FIX: settings table RLS (if it exists)
-- ===================================================================

-- Check if 'settings' table exists and enable RLS
DO $$ 
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'settings'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Enabled RLS on public.settings';
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view settings" ON settings;
    DROP POLICY IF EXISTS "Only admins can modify settings" ON settings;
    
    -- Policy: Anyone can read settings (public read)
    CREATE POLICY "Anyone can view settings"
    ON public.settings
    FOR SELECT
    USING (true);
    
    -- Policy: Only admins can modify settings
    CREATE POLICY "Only admins can modify settings"
    ON public.settings
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
      )
    );
    
    RAISE NOTICE '✅ Created RLS policies for public.settings';
  ELSE
    RAISE NOTICE 'ℹ️  Table public.settings does not exist - skipping';
  END IF;
END $$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Verify RLS is enabled
SELECT 
  '✅ RLS Security Check' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tournament_sync_history', 'settings')
ORDER BY tablename;

-- List all policies created
SELECT 
  '✅ Policies Created' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tournament_sync_history', 'settings')
ORDER BY tablename, policyname;

-- ===================================================================
-- NOTES
-- ===================================================================
-- 
-- TOURNAMENT_SYNC_HISTORY:
-- - This table tracks DataGolf sync operations
-- - Only admins should access this data
-- - Used by admin APIs to prevent duplicate syncs
--
-- SETTINGS:
-- - If this is site_settings, it should already have RLS
-- - This handles a generic 'settings' table if it exists
-- - Public read, admin write pattern
--
-- ADMIN DETECTION:
-- - All policies check the public.admins table
-- - Matches user_id against auth.uid()
-- - Same pattern used throughout the platform
--
-- ===================================================================

-- ============================================================================
-- Fix Last 2 RLS Policy Issues
-- ============================================================================
-- Fixes entry_picks_update_own and ideas_suggestions policies
-- ============================================================================

-- Fix 1: entry_picks - Replace always-true policy with proper security
DROP POLICY IF EXISTS "entry_picks_update_own" ON public.entry_picks;

CREATE POLICY "entry_picks_update_own" ON public.entry_picks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM competition_entries
      WHERE competition_entries.id = entry_picks.entry_id
      AND competition_entries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competition_entries
      WHERE competition_entries.id = entry_picks.entry_id
      AND competition_entries.user_id = auth.uid()
    )
  );

-- Fix 2: ideas_suggestions - Replace always-true admin policy with proper check
DROP POLICY IF EXISTS "Admins can manage ideas" ON public.ideas_suggestions;

CREATE POLICY "Admins can manage ideas" ON public.ideas_suggestions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Verify both are now fixed
SELECT 
    tablename,
    policyname,
    cmd,
    qual as using_clause,
    with_check,
    CASE 
        WHEN qual = 'true' OR with_check = 'true' THEN '❌ INSECURE'
        ELSE '✅ SECURE'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN ('entry_picks_update_own', 'Admins can manage ideas')
ORDER BY tablename;

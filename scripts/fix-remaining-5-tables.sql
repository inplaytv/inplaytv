-- ===================================================================
-- FIX THE REMAINING 5 TABLES WITHOUT POLICIES
-- ===================================================================

-- 1. COURSE_PROFILES - Course information (public read)
DROP POLICY IF EXISTS "course_profiles_read_all" ON public.course_profiles;
CREATE POLICY "course_profiles_read_all"
ON public.course_profiles FOR SELECT
TO authenticated
USING (true);

-- 2. DEV_NOTES - Development notes (admin only or restricted)
DROP POLICY IF EXISTS "dev_notes_read_all" ON public.dev_notes;
CREATE POLICY "dev_notes_read_all"
ON public.dev_notes FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "dev_notes_admin_write" ON public.dev_notes;
CREATE POLICY "dev_notes_admin_write"
ON public.dev_notes FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- 3. GOLFER_RANKING_HISTORY - Historical ranking data (public read)
DROP POLICY IF EXISTS "golfer_ranking_history_read_all" ON public.golfer_ranking_history;
CREATE POLICY "golfer_ranking_history_read_all"
ON public.golfer_ranking_history FOR SELECT
TO authenticated
USING (true);

-- 4. PLAYER_ROUND_STATS - Player statistics (public read)
DROP POLICY IF EXISTS "player_round_stats_read_all" ON public.player_round_stats;
CREATE POLICY "player_round_stats_read_all"
ON public.player_round_stats FOR SELECT
TO authenticated
USING (true);

-- 5. RANKING_SYNC_LOGS - System logs (admin only)
DROP POLICY IF EXISTS "ranking_sync_logs_admin_only" ON public.ranking_sync_logs;
CREATE POLICY "ranking_sync_logs_admin_only"
ON public.ranking_sync_logs FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT 
  '✅ Policies created for all 5 tables!' as status;

-- Check that all tables now have policies
SELECT 
  t.tablename,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND t.tablename IN ('course_profiles', 'dev_notes', 'golfer_ranking_history', 'player_round_stats', 'ranking_sync_logs')
GROUP BY t.tablename
ORDER BY t.tablename;

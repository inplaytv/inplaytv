-- ===================================================================
-- FIX ALL RLS SECURITY ISSUES
-- This script will enable RLS on all tables and create proper policies
-- ===================================================================

-- Enable RLS on all public tables that don't have it
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT LIKE 'pg_%'
          AND tablename NOT LIKE 'sql_%'
          AND rowsecurity = false
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE '✅ Enabled RLS on: %', r.tablename;
    END LOOP;
END $$;

-- ===================================================================
-- CORE TABLES - Basic read access for all authenticated users
-- ===================================================================

-- PROFILES - Users can read all, but only modify their own
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- TOURNAMENTS - Public read access
DROP POLICY IF EXISTS "tournaments_read_all" ON public.tournaments;
CREATE POLICY "tournaments_read_all"
ON public.tournaments FOR SELECT
TO authenticated
USING (true);

-- GOLFERS - Public read access
DROP POLICY IF EXISTS "golfers_read_all" ON public.golfers;
CREATE POLICY "golfers_read_all"
ON public.golfers FOR SELECT
TO authenticated
USING (true);

-- TOURNAMENT_GOLFERS - Public read access
DROP POLICY IF EXISTS "tournament_golfers_read_all" ON public.tournament_golfers;
CREATE POLICY "tournament_golfers_read_all"
ON public.tournament_golfers FOR SELECT
TO authenticated
USING (true);

-- GOLFER_GROUPS - Public read access
DROP POLICY IF EXISTS "golfer_groups_read_all" ON public.golfer_groups;
CREATE POLICY "golfer_groups_read_all"
ON public.golfer_groups FOR SELECT
TO authenticated
USING (true);

-- TOURNAMENT_COMPETITIONS - Public read access
DROP POLICY IF EXISTS "tournament_competitions_read_all" ON public.tournament_competitions;
CREATE POLICY "tournament_competitions_read_all"
ON public.tournament_competitions FOR SELECT
TO authenticated
USING (true);

-- COMPETITION_TYPES - Public read access
DROP POLICY IF EXISTS "competition_types_read_all" ON public.competition_types;
CREATE POLICY "competition_types_read_all"
ON public.competition_types FOR SELECT
TO authenticated
USING (true);

-- ===================================================================
-- USER DATA TABLES - Users can only access their own data
-- ===================================================================

-- COMPETITION_ENTRIES - Users can read/modify their own entries
DROP POLICY IF EXISTS "entries_read_own" ON public.competition_entries;
CREATE POLICY "entries_read_own"
ON public.competition_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_insert_own" ON public.competition_entries;
CREATE POLICY "entries_insert_own"
ON public.competition_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_update_own" ON public.competition_entries;
CREATE POLICY "entries_update_own"
ON public.competition_entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ENTRY_PICKS - Users can read/modify picks for their own entries
DROP POLICY IF EXISTS "entry_picks_read_own" ON public.entry_picks;
CREATE POLICY "entry_picks_read_own"
ON public.entry_picks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.competition_entries
    WHERE competition_entries.id = entry_picks.entry_id
    AND competition_entries.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "entry_picks_insert_own" ON public.entry_picks;
CREATE POLICY "entry_picks_insert_own"
ON public.entry_picks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.competition_entries
    WHERE competition_entries.id = entry_picks.entry_id
    AND competition_entries.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "entry_picks_update_own" ON public.entry_picks;
CREATE POLICY "entry_picks_update_own"
ON public.entry_picks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.competition_entries
    WHERE competition_entries.id = entry_id
    AND user_id = auth.uid()
  )
);

-- ENTRY_SCORES - Users can read their own scores, system can update
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entry_scores') THEN
    DROP POLICY IF EXISTS "entry_scores_read_own" ON public.entry_scores;
    CREATE POLICY "entry_scores_read_own"
    ON public.entry_scores FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.competition_entries
        WHERE competition_entries.id = entry_scores.entry_id
        AND competition_entries.user_id = auth.uid()
      )
    );
    RAISE NOTICE '✅ Created policy for entry_scores';
  END IF;
END $$;

-- ===================================================================
-- COMPETITION INSTANCES - Read access for participants
-- ===================================================================

DROP POLICY IF EXISTS "instances_read_participant" ON public.competition_instances;
CREATE POLICY "instances_read_participant"
ON public.competition_instances FOR SELECT
TO authenticated
USING (
  -- User can see instances they're participating in
  EXISTS (
    SELECT 1 FROM public.competition_entries
    WHERE competition_entries.instance_id = competition_instances.id
    AND competition_entries.user_id = auth.uid()
  )
  OR
  -- Or instances that are open for joining
  status IN ('open', 'registration_open')
);

-- WALLETS - Users can only see their own
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallets') THEN
    DROP POLICY IF EXISTS "wallets_read_own" ON public.wallets;
    CREATE POLICY "wallets_read_own"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;
    CREATE POLICY "wallets_update_own"
    ON public.wallets FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created policies for wallets';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallet_transactions') THEN
    DROP POLICY IF EXISTS "transactions_read_own" ON public.wallet_transactions;
    CREATE POLICY "transactions_read_own"
    ON public.wallet_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created policies for wallet_transactions';
  END IF;
END $$;

-- ADMINS - Only admins can read, service role can modify
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
    DROP POLICY IF EXISTS "admins_read_if_admin" ON public.admins;
    CREATE POLICY "admins_read_if_admin"
    ON public.admins FOR SELECT
    TO authenticated
    USING (
      auth.uid() IN (SELECT user_id FROM public.admins)
    );
    RAISE NOTICE '✅ Created policies for admins';
  END IF;
END $$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT 
  '✅ RLS Security Fix Complete!' as status,
  COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- Check for any remaining tables without RLS
SELECT 
  '⚠️ WARNING: Tables without RLS:' as warning,
  string_agg(tablename, ', ') as tables
FROM pg_tables
WHERE schemaname = 'public' 
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%';

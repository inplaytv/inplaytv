-- ===================================================================
-- FIX ENTRY PICKS RLS POLICIES
-- ===================================================================
-- The leaderboard is failing to fetch entry picks due to RLS restrictions

-- Check current policies on entry_picks
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'entry_picks';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'entry_picks';

-- Drop any restrictive policies
DROP POLICY IF EXISTS "Users can view their own picks" ON entry_picks;
DROP POLICY IF EXISTS "Users can view own picks" ON entry_picks;
DROP POLICY IF EXISTS "entry_picks_select_policy" ON entry_picks;

-- Create permissive SELECT policy
-- Allow authenticated users to see all picks (needed for leaderboards and challenge views)
CREATE POLICY "Allow authenticated users to view all entry picks"
ON entry_picks
FOR SELECT
TO authenticated
USING (true);

-- Keep INSERT policies restrictive (users can only create their own picks)
DROP POLICY IF EXISTS "Users can insert their own picks" ON entry_picks;
CREATE POLICY "Users can insert their own picks"
ON entry_picks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM competition_entries
    WHERE id = entry_picks.entry_id
    AND user_id = auth.uid()
  )
);

-- Keep UPDATE/DELETE restrictive
DROP POLICY IF EXISTS "Users can update their own picks" ON entry_picks;
CREATE POLICY "Users can update their own picks"
ON entry_picks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM competition_entries
    WHERE id = entry_picks.entry_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM competition_entries
    WHERE id = entry_picks.entry_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own picks" ON entry_picks;
CREATE POLICY "Users can delete their own picks"
ON entry_picks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM competition_entries
    WHERE id = entry_picks.entry_id
    AND user_id = auth.uid()
  )
);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ Entry picks RLS policies updated!' as status;

-- Check new policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'entry_picks'
ORDER BY cmd;

-- Test if authenticated users can see picks
SELECT COUNT(*) as total_picks
FROM entry_picks;

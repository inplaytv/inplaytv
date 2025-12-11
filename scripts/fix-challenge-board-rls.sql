-- ===================================================================
-- FIX CHALLENGE BOARD RLS POLICIES
-- ===================================================================
-- The Challenge Board isn't showing challenges because RLS policies
-- are too restrictive on competition_instances and competition_entries

-- 1. Drop existing restrictive policies on competition_instances
DROP POLICY IF EXISTS "Users can view their own instances" ON competition_instances;
DROP POLICY IF EXISTS "Users can view own instances" ON competition_instances;
DROP POLICY IF EXISTS "competition_instances_select_policy" ON competition_instances;

-- 2. Create permissive SELECT policy for competition_instances
-- Allow authenticated users to see ALL instances (for Challenge Board)
CREATE POLICY "Allow authenticated users to view all competition instances"
ON competition_instances
FOR SELECT
TO authenticated
USING (true);

-- 3. Drop existing restrictive policies on competition_entries
DROP POLICY IF EXISTS "Users can view their own entries" ON competition_entries;
DROP POLICY IF EXISTS "Users can view own entries" ON competition_entries;
DROP POLICY IF EXISTS "competition_entries_select_policy" ON competition_entries;

-- 4. Create permissive SELECT policy for competition_entries
-- Allow authenticated users to see ALL entries (needed for Challenge Board display)
CREATE POLICY "Allow authenticated users to view all competition entries"
ON competition_entries
FOR SELECT
TO authenticated
USING (true);

-- 5. Keep INSERT policies restrictive (users can only create their own entries)
DROP POLICY IF EXISTS "Users can insert their own entries" ON competition_entries;
CREATE POLICY "Users can insert their own entries"
ON competition_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Keep UPDATE/DELETE restrictive on competition_entries
DROP POLICY IF EXISTS "Users can update their own entries" ON competition_entries;
CREATE POLICY "Users can update their own entries"
ON competition_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own entries" ON competition_entries;
CREATE POLICY "Users can delete their own entries"
ON competition_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ Challenge Board RLS policies updated!' as status;

-- Check new policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('competition_instances', 'competition_entries')
ORDER BY tablename, cmd;

-- Test if authenticated users can now see all instances
SELECT 
  COUNT(*) as total_instances,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'full') as full_count
FROM competition_instances;

-- Test if authenticated users can see all entries
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT instance_id) as instances_with_entries
FROM competition_entries;

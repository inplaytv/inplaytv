-- Fix: Remove recursive RLS policy that causes infinite recursion
-- The "Users can view entries in their competitions" policy queries clubhouse_entries
-- within the clubhouse_entries policy check, causing recursion.
-- Run this in Supabase SQL Editor

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view entries in their competitions" ON clubhouse_entries;

-- Keep only the simple policy that allows users to view their own entries
-- (This policy already exists, just confirming it's correct)
DROP POLICY IF EXISTS "Users can view own entries" ON clubhouse_entries;
CREATE POLICY "Users can view own entries"
  ON clubhouse_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Verify policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'clubhouse_entries';

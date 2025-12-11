-- ===================================================================
-- FIX ADMINS TABLE RLS + ADD SUPER ADMIN SYSTEM
-- ===================================================================

-- Drop all existing policies on admins table
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;
DROP POLICY IF EXISTS "Users can view their own admin status" ON admins;

-- Add is_super_admin column if it doesn't exist
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Recreate policies WITHOUT recursion
-- Policy 1: Allow authenticated users to check if THEY are an admin (for their own user_id only)
CREATE POLICY "Users can view their own admin status"
ON admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Service role bypasses RLS automatically, no policy needed

-- Note: All admin management operations MUST use service_role (admin client)
-- This prevents infinite recursion completely

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ Admins RLS policies fixed + Super Admin system added!' as status;

-- Check policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'admins'
ORDER BY policyname;

-- Show current admins
SELECT 
  a.user_id,
  u.email,
  a.is_super_admin,
  a.created_at
FROM admins a
LEFT JOIN auth.users u ON u.id = a.user_id
ORDER BY a.is_super_admin DESC, a.created_at ASC;

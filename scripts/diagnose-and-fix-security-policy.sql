-- ===================================================================
-- DIAGNOSE SECURITY POLICY ISSUES
-- ===================================================================
-- Run this to check if the security policy table exists and has data

-- 1. Check if table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_security_policies'
  ) as table_exists;

-- 2. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'admin_security_policies'
ORDER BY ordinal_position;

-- 3. Check if default policy exists
SELECT 
  COUNT(*) as policy_count,
  string_agg(policy_name, ', ') as policy_names
FROM public.admin_security_policies;

-- 4. Show the default policy (if exists)
SELECT * FROM public.admin_security_policies 
WHERE policy_name = 'default';

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'admin_security_policies';

-- 6. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'admin_security_policies';

-- ===================================================================
-- If table doesn't exist or has no data, here's the fix:
-- ===================================================================

-- Recreate table (safe - uses IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.admin_security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(100) NOT NULL UNIQUE,
  require_mfa_for_all BOOLEAN DEFAULT false,
  require_email_verification BOOLEAN DEFAULT true,
  mfa_grace_period_days INTEGER DEFAULT 7,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  session_timeout_hours INTEGER DEFAULT 24,
  force_password_change_days INTEGER DEFAULT 90,
  minimum_password_length INTEGER DEFAULT 8,
  require_special_characters BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_security_policies ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to recreate
DROP POLICY IF EXISTS "Anyone can view security policies" ON admin_security_policies;

-- Create RLS policy that works with service role
CREATE POLICY "Anyone can view security policies"
ON admin_security_policies
FOR SELECT
USING (true);  -- Allow all authenticated users to read

DROP POLICY IF EXISTS "Only admins can modify policies" ON admin_security_policies;

CREATE POLICY "Only admins can modify policies"
ON admin_security_policies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- Insert/update default policy
INSERT INTO public.admin_security_policies (
  policy_name, 
  require_mfa_for_all, 
  require_email_verification,
  mfa_grace_period_days,
  max_login_attempts,
  lockout_duration_minutes,
  session_timeout_hours,
  force_password_change_days,
  minimum_password_length,
  require_special_characters
)
VALUES (
  'default', 
  false, 
  true,
  7,
  5,
  30,
  24,
  90,
  8,
  true
)
ON CONFLICT (policy_name) 
DO UPDATE SET
  require_mfa_for_all = EXCLUDED.require_mfa_for_all,
  require_email_verification = EXCLUDED.require_email_verification,
  mfa_grace_period_days = EXCLUDED.mfa_grace_period_days,
  max_login_attempts = EXCLUDED.max_login_attempts,
  lockout_duration_minutes = EXCLUDED.lockout_duration_minutes,
  session_timeout_hours = EXCLUDED.session_timeout_hours,
  force_password_change_days = EXCLUDED.force_password_change_days,
  minimum_password_length = EXCLUDED.minimum_password_length,
  require_special_characters = EXCLUDED.require_special_characters,
  updated_at = NOW();

-- Final verification
SELECT 
  '✅ Security policy fixed!' as status,
  policy_name,
  require_mfa_for_all,
  require_email_verification,
  created_at,
  updated_at
FROM public.admin_security_policies 
WHERE policy_name = 'default';

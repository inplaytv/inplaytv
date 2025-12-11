-- ===================================================================
-- USER SECURITY & MFA SYSTEM SETUP
-- ===================================================================

-- 1. Create user_security_settings table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method VARCHAR(20) DEFAULT 'email', -- 'email', 'totp', 'sms'
  email_verification_required BOOLEAN DEFAULT false,
  last_mfa_setup_at TIMESTAMPTZ,
  backup_codes TEXT[], -- Encrypted backup codes for account recovery
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Create mfa_verification_codes table (for email/SMS codes)
CREATE TABLE IF NOT EXISTS public.mfa_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  code_type VARCHAR(20) NOT NULL, -- 'login', 'setup', 'reset'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create admin_security_policies table (global MFA settings)
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

-- Insert default security policy
INSERT INTO public.admin_security_policies (policy_name, require_mfa_for_all, require_email_verification)
VALUES ('default', false, true)
ON CONFLICT (policy_name) DO NOTHING;

-- 4. Create user_login_attempts table (track failed logins)
CREATE TABLE IF NOT EXISTS public.user_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  failure_reason VARCHAR(100),
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create user_sessions table (track active sessions)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS on all tables
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for user_security_settings
DROP POLICY IF EXISTS "Users can view their own security settings" ON user_security_settings;
CREATE POLICY "Users can view their own security settings"
ON user_security_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own security settings" ON user_security_settings;
CREATE POLICY "Users can update their own security settings"
ON user_security_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all security settings" ON user_security_settings;
CREATE POLICY "Admins can view all security settings"
ON user_security_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- 8. RLS Policies for mfa_verification_codes
DROP POLICY IF EXISTS "Users can view their own codes" ON mfa_verification_codes;
CREATE POLICY "Users can view their own codes"
ON mfa_verification_codes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND expires_at > NOW() AND used_at IS NULL);

-- 9. RLS Policies for admin_security_policies
DROP POLICY IF EXISTS "Anyone can view security policies" ON admin_security_policies;
CREATE POLICY "Anyone can view security policies"
ON admin_security_policies
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only admins can modify policies" ON admin_security_policies;
CREATE POLICY "Only admins can modify policies"
ON admin_security_policies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- 10. RLS Policies for user_login_attempts
DROP POLICY IF EXISTS "Users can view their own login attempts" ON user_login_attempts;
CREATE POLICY "Users can view their own login attempts"
ON user_login_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all login attempts" ON user_login_attempts;
CREATE POLICY "Admins can view all login attempts"
ON user_login_attempts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- 11. RLS Policies for user_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions"
ON user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can revoke their own sessions" ON user_sessions;
CREATE POLICY "Users can revoke their own sessions"
ON user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_codes_user_expires ON mfa_verification_codes(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON user_login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON user_sessions(user_id, expires_at);

-- 13. Create function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM mfa_verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 14. Create function to generate secure 6-digit code
CREATE OR REPLACE FUNCTION generate_mfa_code()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code VARCHAR(6);
BEGIN
  code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN code;
END;
$$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ User security & MFA system created successfully!' as status;

-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_security_settings',
  'mfa_verification_codes',
  'admin_security_policies',
  'user_login_attempts',
  'user_sessions'
)
ORDER BY table_name;

-- Check default policy exists
SELECT * FROM admin_security_policies WHERE policy_name = 'default';

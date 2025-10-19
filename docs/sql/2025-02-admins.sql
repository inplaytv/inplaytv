-- Migration: Admin RBAC system
-- Created: 2025-02-19
-- Purpose: Restrict admin panel access to authorized staff only
-- BOOTSTRAP: After running this, manually insert first admin:
--   INSERT INTO public.admins(user_id) VALUES ('<your-auth-user-id>');

-- Create admins table (whitelist of authorized admin users)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;

-- RLS policies: Only existing admins can manage admin list
CREATE POLICY "Admins can view all admins"
  ON public.admins
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert new admins"
  ON public.admins
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can delete admins"
  ON public.admins
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ));

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.admins TO authenticated;

-- Helper function: Check if a user is an admin
DROP FUNCTION IF EXISTS public.is_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = uid
  );
$$;

-- Grant execute to authenticated and anon
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- BOOTSTRAP INSTRUCTIONS:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Get your user_id from auth.users (sign in first to create user):
--    SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 3. Insert yourself as first admin:
--    INSERT INTO public.admins(user_id) VALUES ('<your-user-id>');
-- 4. Now you can access admin.inplay.tv and manage other admins

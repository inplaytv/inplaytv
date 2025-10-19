-- Add your user as admin
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/sql/new

-- Your User ID: 722a6137-e43a-4184-b31e-eb0fea2f6dff

-- 1. Add as admin
INSERT INTO public.admins(user_id) 
VALUES ('722a6137-e43a-4184-b31e-eb0fea2f6dff')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Verify it worked
SELECT 
  a.user_id,
  u.email,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id
WHERE a.user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

-- 3. Test the is_admin function
SELECT public.is_admin('722a6137-e43a-4184-b31e-eb0fea2f6dff') as is_admin;
-- Should return: true

-- If you get an error about the admins table not existing, 
-- you need to run the migration first:
-- Copy contents of: docs/sql/2025-02-admins.sql
-- And run it in SQL Editor

-- Add leroyg@live.com as admin in LOCAL database
-- Run this in Supabase SQL Editor for your LOCAL project

-- Step 1: Find your user_id
SELECT id, email FROM auth.users WHERE email = 'leroyg@live.com';

-- Step 2: Copy the id from above, then run:
-- INSERT INTO admins (user_id, created_at)
-- VALUES ('YOUR-USER-ID-HERE', NOW())
-- ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify
-- SELECT a.user_id, u.email 
-- FROM admins a
-- JOIN auth.users u ON u.id = a.user_id
-- WHERE u.email = 'leroyg@live.com';

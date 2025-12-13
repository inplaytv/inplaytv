-- Make your user an admin
-- Replace YOUR_EMAIL with your actual email address

UPDATE profiles
SET is_admin = true
WHERE email = 'YOUR_EMAIL@example.com';

-- Verify
SELECT id, email, username, is_admin
FROM profiles
WHERE is_admin = true;

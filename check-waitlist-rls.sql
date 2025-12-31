-- Check RLS policies on waitlist table
SELECT * FROM pg_policies WHERE tablename = 'waitlist';

-- Try deleting manually to test
-- First, get an ID:
SELECT id, email FROM waitlist LIMIT 1;

-- Then try to delete it (replace with actual ID):
-- DELETE FROM waitlist WHERE id = 'YOUR-ID-HERE';

-- Check if waitlist entries still exist
SELECT * FROM waitlist ORDER BY created_at DESC;

-- Count entries
SELECT COUNT(*) as total FROM waitlist;

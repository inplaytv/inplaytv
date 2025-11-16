-- ===================================================================
-- CLEAR GOLFERS FROM A SPECIFIC COMPETITION
-- Run this in Supabase Dashboard SQL Editor
-- Replace the competition_id with your actual competition ID
-- ===================================================================

-- Delete all golfers from the PGA Championship competition
DELETE FROM public.competition_golfers 
WHERE competition_id = 'b0ded91c-1818-4764-8231-1f6ada6e1934';

-- Check how many were deleted
SELECT 'Cleared competition golfers' AS message;

-- Verify it's empty
SELECT COUNT(*) AS remaining_golfers 
FROM public.competition_golfers 
WHERE competition_id = 'b0ded91c-1818-4764-8231-1f6ada6e1934';

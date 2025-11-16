-- ===================================================================
-- DELETE ORPHANED ENTRY
-- Remove the incomplete entry that has no payment
-- ===================================================================

DELETE FROM competition_entries 
WHERE id = '427d42e5-6035-4134-a94d-3026ec033a53';

-- Verify deletion
SELECT 'Orphaned entry deleted' AS status;

-- Check remaining entries
SELECT COUNT(*) as remaining_entries 
FROM competition_entries 
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff';

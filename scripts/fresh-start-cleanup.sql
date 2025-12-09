-- ============================================
-- COMPLETE CLEANUP FOR FRESH ONE 2 ONE TESTING
-- ============================================
-- This script removes ALL ONE 2 ONE test data
-- Run this to start fresh testing with clean database
-- ============================================

-- STEP 1: Show what will be deleted (DRY RUN - SAFE TO RUN)
SELECT '=== DRY RUN - Nothing deleted yet ===' as info;

SELECT 'Wallet Transactions' as table_name, COUNT(*) as will_be_deleted 
FROM wallet_transactions 
WHERE related_entry_id IN (
  SELECT id FROM competition_entries WHERE instance_id IS NOT NULL
);

SELECT 'Entry Picks' as table_name, COUNT(*) as will_be_deleted 
FROM entry_picks 
WHERE entry_id IN (
  SELECT id FROM competition_entries WHERE instance_id IS NOT NULL
);

SELECT 'Competition Entries (ONE 2 ONE)' as table_name, COUNT(*) as will_be_deleted 
FROM competition_entries 
WHERE instance_id IS NOT NULL;

SELECT 'Competition Instances' as table_name, 
       COUNT(*) as will_be_deleted,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
       COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
       COUNT(CASE WHEN status = 'full' THEN 1 END) as full,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM competition_instances;

-- Show specific instances that will be deleted
SELECT 
    id,
    instance_number,
    status,
    current_players,
    entry_fee_pennies,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM competition_instances
ORDER BY created_at DESC;

-- ============================================
-- STEP 2: EXECUTE DELETION (Uncomment to run)
-- ============================================
/*
-- Delete wallet transactions related to ONE 2 ONE entries
DELETE FROM wallet_transactions 
WHERE related_entry_id IN (
  SELECT id FROM competition_entries WHERE instance_id IS NOT NULL
);

-- Delete entry picks for ONE 2 ONE entries
DELETE FROM entry_picks 
WHERE entry_id IN (
  SELECT id FROM competition_entries WHERE instance_id IS NOT NULL
);

-- Delete ONE 2 ONE competition entries
DELETE FROM competition_entries 
WHERE instance_id IS NOT NULL;

-- Delete ALL competition instances (pending, open, full, active, etc.)
DELETE FROM competition_instances;
*/

-- ============================================
-- STEP 3: Verify cleanup (Run after uncommenting above)
-- ============================================
SELECT '=== VERIFICATION ===' as info;

SELECT 'Competition Instances' as table_name, 
       COUNT(*) as remaining,
       COALESCE(STRING_AGG(DISTINCT status, ', '), 'none') as statuses_remaining
FROM competition_instances;

SELECT 'Competition Entries (ONE 2 ONE)' as table_name, COUNT(*) as remaining 
FROM competition_entries 
WHERE instance_id IS NOT NULL;

SELECT 'Entry Picks (ONE 2 ONE)' as table_name, COUNT(*) as remaining 
FROM entry_picks 
WHERE entry_id IN (
  SELECT id FROM competition_entries WHERE instance_id IS NOT NULL
);

SELECT 'Wallet Transactions (ONE 2 ONE)' as table_name, COUNT(*) as remaining 
FROM wallet_transactions 
WHERE related_entry_id IN (
  SELECT id FROM competition_entries WHERE instance_id IS NOT NULL
);

SELECT 'SUCCESS: All ONE 2 ONE data cleaned!' as result 
WHERE NOT EXISTS (SELECT 1 FROM competition_instances);

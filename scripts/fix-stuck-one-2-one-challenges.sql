-- Fix Stuck ONE 2 ONE Challenges
-- Run this in Supabase SQL Editor

-- Step 0: Find ALL stuck instances (not just duplicates with >2, but also those with mismatched counts)
SELECT 
  ci.id as instance_id,
  ci.instance_number,
  ci.entry_fee_pennies,
  ci.status,
  ci.current_players,
  COUNT(ce.id) as actual_entry_count,
  CASE 
    WHEN COUNT(ce.id) > ci.current_players THEN '⚠️ MISMATCH: More entries than current_players'
    WHEN COUNT(ce.id) < ci.current_players THEN '⚠️ MISMATCH: Fewer entries than current_players'
    WHEN COUNT(ce.id) = 2 AND ci.status != 'full' THEN '⚠️ Should be FULL'
    WHEN COUNT(ce.id) = 1 AND ci.status != 'open' THEN '⚠️ Should be OPEN'
    ELSE '✅ OK'
  END as issue,
  STRING_AGG(DISTINCT ce.user_id::text, ', ') as user_ids
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
WHERE ci.status IN ('open', 'pending')
GROUP BY ci.id
ORDER BY ci.created_at DESC;

-- Step 1: Find all instances with more than 2 entries (duplicates)
-- This will show you what needs fixing
SELECT 
  ci.id as instance_id,
  ci.instance_number,
  ci.entry_fee_pennies,
  ci.status,
  ci.current_players,
  COUNT(ce.id) as actual_entry_count,
  STRING_AGG(ce.user_id::text, ', ') as user_ids,
  STRING_AGG(ce.id::text, ', ') as entry_ids
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
WHERE ci.status IN ('open', 'pending')
GROUP BY ci.id
HAVING COUNT(ce.id) > 2
ORDER BY ci.created_at DESC;

-- Step 2: For the specific £18 challenge (instance ID: 02cf7721-5e83-421a-9196-7c673ba1041a)
-- Delete Terry's duplicate entries (keep only the FIRST one per user)

-- First, see what entries exist for this instance:
SELECT 
  ce.id,
  ce.user_id,
  ce.created_at,
  ce.status,
  ce.entry_fee_paid
FROM competition_entries ce
WHERE ce.instance_id = '02cf7721-5e83-421a-9196-7c673ba1041a'
ORDER BY ce.user_id, ce.created_at;

-- Step 3: Delete duplicate entries (keeping only the earliest entry per user)
-- IMPORTANT: Review the results from Step 2 first to identify which entries to keep!

-- Delete duplicates (adjust the entry IDs based on Step 2 results)
-- Example: If Terry has entries with IDs 'xxx', 'yyy', 'zzz' and 'xxx' is the first:
-- DELETE FROM competition_entries WHERE id IN ('yyy', 'zzz');

-- For the specific instance 02cf7721-5e83-421a-9196-7c673ba1041a:
WITH ranked_entries AS (
  SELECT 
    id,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM competition_entries
  WHERE instance_id = '02cf7721-5e83-421a-9196-7c673ba1041a'
)
DELETE FROM competition_entries
WHERE id IN (
  SELECT id FROM ranked_entries WHERE rn > 1
);

-- Step 4: Update the instance to 'full' status with 2 players
UPDATE competition_instances
SET 
  status = 'full',
  current_players = 2
WHERE id = '02cf7721-5e83-421a-9196-7c673ba1041a';

-- Step 5: Verify the fix
SELECT 
  ci.id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.max_players,
  COUNT(ce.id) as entry_count
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
WHERE ci.id = '02cf7721-5e83-421a-9196-7c673ba1041a'
GROUP BY ci.id;

-- Step 6: Check what entries remain
SELECT 
  ce.id,
  ce.user_id,
  ce.created_at,
  ce.status
FROM competition_entries ce
WHERE ce.instance_id = '02cf7721-5e83-421a-9196-7c673ba1041a'
ORDER BY ce.created_at;

-- Step 7: If Terry was charged multiple times, refund the duplicate charges
-- First, check wallet transactions for the instance
SELECT 
  wt.id,
  wt.user_id,
  wt.change_cents,
  wt.reason,
  wt.balance_after_cents,
  wt.created_at
FROM wallet_transactions wt
WHERE wt.reason LIKE '%02cf7721-5e83-421a-9196-7c673ba1041a%'
   OR wt.reason LIKE '%competition%'
ORDER BY wt.created_at DESC
LIMIT 20;

-- If there are duplicate charges, refund them:
-- (Replace USER_ID with Terry's actual user_id from Step 2)
-- First update the wallet balance:
-- UPDATE wallets 
-- SET balance_cents = balance_cents + 1800  -- £18 in pennies
-- WHERE user_id = 'TERRY_USER_ID';

-- Then create refund transaction record:
-- INSERT INTO wallet_transactions (user_id, change_cents, reason, balance_after_cents)
-- VALUES ('TERRY_USER_ID', 1800, 'Refund for duplicate ONE 2 ONE entry - instance 02cf7721-5e83-421a-9196-7c673ba1041a', 
--         (SELECT balance_cents FROM wallets WHERE user_id = 'TERRY_USER_ID'));

-- NOTES:
-- - Run each step one at a time and review results
-- - The duplicate entry deletion (Step 3) will automatically keep the first entry per user
-- - After this fix, the challenge should show as 'full' and display correct badges for both users
-- - Tomorrow when you test again, the duplicate entry check will prevent this issue

-- ============================================
-- STEP 8: FIX ALL STUCK INSTANCES AT ONCE
-- ============================================
-- Use this to fix ALL stuck instances automatically

-- First, delete ALL duplicate entries (keeps first entry per user per instance)
WITH ranked_entries AS (
  SELECT 
    ce.id,
    ce.instance_id,
    ce.user_id,
    ce.created_at,
    ROW_NUMBER() OVER (PARTITION BY ce.instance_id, ce.user_id ORDER BY ce.created_at ASC) as rn
  FROM competition_entries ce
  INNER JOIN competition_instances ci ON ci.id = ce.instance_id
  WHERE ci.status IN ('open', 'pending')
)
DELETE FROM competition_entries
WHERE id IN (
  SELECT id FROM ranked_entries WHERE rn > 1
);

-- Then, update all instances to correct status based on entry count
WITH instance_counts AS (
  SELECT 
    ci.id,
    COUNT(ce.id) as entry_count
  FROM competition_instances ci
  LEFT JOIN competition_entries ce ON ce.instance_id = ci.id AND ce.status = 'submitted'
  WHERE ci.status IN ('open', 'pending')
  GROUP BY ci.id
)
UPDATE competition_instances ci
SET 
  status = CASE 
    WHEN ic.entry_count >= 2 THEN 'full'
    WHEN ic.entry_count = 1 THEN 'open'
    ELSE 'pending'
  END,
  current_players = ic.entry_count
FROM instance_counts ic
WHERE ci.id = ic.id;

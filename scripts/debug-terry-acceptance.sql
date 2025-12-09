-- Debug Terry's acceptance issue
-- Find what's blocking Terry

-- ============================================
-- STEP 1: Find Terry's user_id
-- ============================================
SELECT id, username
FROM profiles 
WHERE username ILIKE '%terry%';

-- ============================================
-- STEP 2: Check ALL entries for Terry (including failed ones)
-- ============================================
-- Replace TERRY_USER_ID with the actual ID from Step 1
SELECT 
  ce.id,
  ce.instance_id,
  ce.competition_id,
  ce.status,
  ce.created_at,
  ci.status as instance_status,
  ci.entry_fee_pennies
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
WHERE ce.user_id = 'TERRY_USER_ID'  -- Replace with actual Terry user_id
ORDER BY ce.created_at DESC;

-- ============================================
-- STEP 3: Check for the NEW £5 challenge you just created
-- ============================================
-- Find the most recent pending/open £5 instance
SELECT 
  ci.id as instance_id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.created_at,
  COUNT(ce.id) as entry_count,
  STRING_AGG(p.username, ', ') as usernames
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ci.entry_fee_pennies = 500  -- £5
  AND ci.created_at > NOW() - INTERVAL '1 hour'
GROUP BY ci.id
ORDER BY ci.created_at DESC
LIMIT 5;

-- ============================================
-- STEP 4: Delete ALL of Terry's entries (nuclear option)
-- ============================================
-- This will completely clear Terry's history so he can accept challenges
-- Run this ONLY if Step 2 shows old entries blocking him

-- First, get Terry's user_id from Step 1, then:
-- DELETE FROM competition_entries WHERE user_id = 'TERRY_USER_ID';

-- ============================================
-- STEP 5: Verify Terry has NO entries left
-- ============================================
-- SELECT COUNT(*) FROM competition_entries WHERE user_id = 'TERRY_USER_ID';
-- Should return 0

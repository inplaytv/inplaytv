-- BULK FIX ALL STUCK ONE 2 ONE INSTANCES
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: See what's broken (BEFORE)
-- ============================================
SELECT 
  ci.id as instance_id,
  ci.instance_number,
  ci.entry_fee_pennies,
  ci.status as current_status,
  ci.current_players as current_player_count,
  COUNT(ce.id) as actual_entry_count,
  CASE 
    WHEN COUNT(ce.id) > ci.current_players THEN '⚠️ MISMATCH: More entries than current_players'
    WHEN COUNT(ce.id) < ci.current_players THEN '⚠️ MISMATCH: Fewer entries than current_players'
    WHEN COUNT(ce.id) = 2 AND ci.status != 'full' THEN '⚠️ Should be FULL'
    WHEN COUNT(ce.id) = 1 AND ci.status != 'open' THEN '⚠️ Should be OPEN'
    ELSE '✅ OK'
  END as issue,
  STRING_AGG(DISTINCT p.username, ', ') as usernames
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ci.status IN ('open', 'pending')
GROUP BY ci.id
ORDER BY ci.created_at DESC;

-- ============================================
-- STEP 2: DELETE ALL DUPLICATE ENTRIES
-- ============================================
-- This keeps only the FIRST entry per user per instance
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

-- ============================================
-- STEP 3: UPDATE ALL INSTANCE STATUSES
-- ============================================
-- This sets the correct status based on actual entry count
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

-- ============================================
-- STEP 4: Verify the fix (AFTER)
-- ============================================
SELECT 
  ci.id as instance_id,
  ci.instance_number,
  ci.entry_fee_pennies,
  ci.status as fixed_status,
  ci.current_players as fixed_player_count,
  COUNT(ce.id) as actual_entry_count,
  CASE 
    WHEN COUNT(ce.id) != ci.current_players THEN '❌ STILL BROKEN'
    WHEN COUNT(ce.id) = 2 AND ci.status = 'full' THEN '✅ FULL (2 players)'
    WHEN COUNT(ce.id) = 1 AND ci.status = 'open' THEN '✅ OPEN (1 player)'
    WHEN COUNT(ce.id) = 0 AND ci.status = 'pending' THEN '✅ PENDING (0 players)'
    ELSE '⚠️ CHECK THIS'
  END as status_check,
  STRING_AGG(DISTINCT p.username, ', ') as usernames
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ci.status IN ('open', 'pending', 'full')
GROUP BY ci.id
ORDER BY ci.created_at DESC
LIMIT 20;

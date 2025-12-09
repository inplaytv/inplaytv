-- FINAL CLEANUP - Remove ALL stuck/pending instances
-- This will give you a completely fresh start

-- ============================================
-- OPTION 1: DELETE ALL PENDING INSTANCES
-- ============================================
-- These are instances with 0 players that are just sitting there
DELETE FROM competition_instances
WHERE status = 'pending' 
  AND current_players = 0;

-- ============================================
-- OPTION 2: DELETE ALL OPEN INSTANCES WITH 1 PLAYER
-- ============================================
-- These are challenges waiting for opponent - let's clear them out
-- First delete their entries
DELETE FROM competition_entries
WHERE instance_id IN (
  SELECT id FROM competition_instances 
  WHERE status = 'open' AND current_players = 1
);

-- Then delete the instances
DELETE FROM competition_instances
WHERE status = 'open' 
  AND current_players = 1;

-- ============================================
-- OPTION 3: KEEP ONLY FULL CHALLENGES (2 players)
-- ============================================
-- This is the safest - only delete incomplete challenges
-- Delete entries for non-full instances
DELETE FROM competition_entries
WHERE instance_id IN (
  SELECT id FROM competition_instances 
  WHERE status IN ('open', 'pending')
);

-- Delete the non-full instances
DELETE FROM competition_instances
WHERE status IN ('open', 'pending');

-- ============================================
-- VERIFY: Check what's left
-- ============================================
SELECT 
  ci.id as instance_id,
  ci.instance_number,
  ci.entry_fee_pennies,
  ci.status,
  ci.current_players,
  COUNT(ce.id) as actual_entries,
  STRING_AGG(DISTINCT p.username, ', ') as players
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ci.created_at > NOW() - INTERVAL '7 days'
GROUP BY ci.id
ORDER BY ci.created_at DESC;

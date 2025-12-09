-- Simple fix for Terry - Run this entire script at once

-- This will show Terry's entries (if any) that are blocking him
SELECT 
  ce.id,
  ce.instance_id,
  ce.status,
  ce.created_at,
  ci.status as instance_status,
  ci.entry_fee_pennies
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
WHERE ce.user_id = (SELECT id FROM profiles WHERE username ILIKE '%terry%' LIMIT 1)
ORDER BY ce.created_at DESC;

-- Delete ALL of Terry's old entries so he can accept challenges
DELETE FROM competition_entries
WHERE user_id = (SELECT id FROM profiles WHERE username ILIKE '%terry%' LIMIT 1);

-- Verify Terry has no entries left (should return 0)
SELECT COUNT(*) as terry_entries_remaining
FROM competition_entries
WHERE user_id = (SELECT id FROM profiles WHERE username ILIKE '%terry%' LIMIT 1);

-- Show your recent £5 challenge
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

-- Fix the £5 challenge mess
-- Run each query ONE AT A TIME and check results

-- STEP 1: See the full details of both instances
SELECT 
  ci.id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.created_at
FROM competition_instances ci
WHERE ci.entry_fee_pennies = 500  -- £5
  AND ci.created_at > NOW() - INTERVAL '2 hours'
ORDER BY ci.created_at DESC;

-- STEP 2: See who has entries in each instance
SELECT 
  ce.id as entry_id,
  ce.instance_id,
  p.username,
  ce.created_at
FROM competition_entries ce
LEFT JOIN profiles p ON p.id = ce.user_id
WHERE ce.instance_id IN (
  SELECT ci.id 
  FROM competition_instances ci
  WHERE ci.entry_fee_pennies = 500  
    AND ci.created_at > NOW() - INTERVAL '2 hours'
)
ORDER BY ce.instance_id, ce.created_at;

-- STEP 3: Delete ALL entries for both £5 instances
DELETE FROM competition_entries
WHERE instance_id IN (
  SELECT ci.id 
  FROM competition_instances ci
  WHERE ci.entry_fee_pennies = 500  
    AND ci.created_at > NOW() - INTERVAL '2 hours'
);

-- STEP 4: Delete both £5 instances
DELETE FROM competition_instances
WHERE entry_fee_pennies = 500  
  AND created_at > NOW() - INTERVAL '2 hours';

-- STEP 5: Verify everything is gone
SELECT 'Instances left:' as check_type, COUNT(*) as count
FROM competition_instances
WHERE entry_fee_pennies = 500 AND created_at > NOW() - INTERVAL '2 hours'
UNION ALL
SELECT 'Entries left:' as check_type, COUNT(*) as count
FROM competition_entries
WHERE instance_id IN (
  SELECT id FROM competition_instances 
  WHERE entry_fee_pennies = 500 AND created_at > NOW() - INTERVAL '2 hours'
);

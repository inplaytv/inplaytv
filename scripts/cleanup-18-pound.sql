-- Clean up the £18 duplicate that just happened
-- Run Step 3 and Step 4 to delete everything

-- STEP 1: See all £18 instances
SELECT 
  ci.id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.created_at
FROM competition_instances ci
WHERE ci.entry_fee_pennies = 1800  -- £18
ORDER BY ci.created_at DESC
LIMIT 5;

-- STEP 2: See all entries for £18 instances
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
  WHERE ci.entry_fee_pennies = 1800
  ORDER BY ci.created_at DESC
  LIMIT 5
)
ORDER BY ce.instance_id, ce.created_at;

-- STEP 3: Delete ALL £18 entries
DELETE FROM competition_entries
WHERE instance_id IN (
  SELECT ci.id 
  FROM competition_instances ci
  WHERE ci.entry_fee_pennies = 1800
);

-- STEP 4: Delete ALL £18 instances
DELETE FROM competition_instances
WHERE entry_fee_pennies = 1800;

-- STEP 5: Verify clean
SELECT COUNT(*) as remaining_18_instances
FROM competition_instances
WHERE entry_fee_pennies = 1800;

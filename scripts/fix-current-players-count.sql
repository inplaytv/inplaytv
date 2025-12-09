-- FIX CURRENT PLAYERS COUNT FOR ONE 2 ONE INSTANCES
-- This fixes instances that were incorrectly marked as 'full' when only the creator joined

-- Update all instances to have correct current_players count based on actual entries
UPDATE competition_instances ci
SET 
  current_players = (
    SELECT COUNT(DISTINCT user_id)
    FROM competition_entries ce
    WHERE ce.instance_id = ci.id
    AND ce.user_id IS NOT NULL
  ),
  status = CASE 
    WHEN (
      SELECT COUNT(DISTINCT user_id)
      FROM competition_entries ce
      WHERE ce.instance_id = ci.id
      AND ce.user_id IS NOT NULL
    ) >= ci.max_players THEN 'full'
    WHEN (
      SELECT COUNT(DISTINCT user_id)
      FROM competition_entries ce
      WHERE ce.instance_id = ci.id
      AND ce.user_id IS NOT NULL
    ) > 0 THEN 'open'
    ELSE ci.status
  END
WHERE ci.id IN (
  SELECT DISTINCT instance_id 
  FROM competition_entries 
  WHERE instance_id IS NOT NULL
);

-- Show results
SELECT 
  ci.id,
  ci.instance_number,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.entry_fee_pennies,
  (SELECT COUNT(*) FROM competition_entries WHERE instance_id = ci.id) as actual_entries
FROM competition_instances ci
ORDER BY ci.created_at DESC;

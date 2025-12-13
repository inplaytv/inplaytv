-- Fix current_players count for instances with entries
-- This should be done by a trigger, but we'll fix manually

UPDATE competition_instances ci
SET current_players = (
  SELECT COUNT(DISTINCT ce.user_id)
  FROM competition_entries ce
  WHERE ce.instance_id = ci.id
    AND ce.user_id IS NOT NULL
    AND ce.status IN ('pending', 'active', 'submitted')
)
WHERE ci.status IN ('pending', 'open')
  AND ci.created_at > NOW() - INTERVAL '1 day';

-- Verify the fix
SELECT 
  ci.id as instance_id,
  ci.status,
  ci.current_players as updated_count,
  ci.created_at,
  COUNT(ce.id) as actual_entries
FROM competition_instances ci
LEFT JOIN competition_entries ce ON ci.id = ce.instance_id AND ce.user_id IS NOT NULL
WHERE ci.created_at > NOW() - INTERVAL '1 day'
GROUP BY ci.id, ci.status, ci.current_players, ci.created_at
ORDER BY ci.created_at DESC;

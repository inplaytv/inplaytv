-- ===================================================================
-- DEBUG CHALLENGE BOARD ISSUES
-- ===================================================================

-- 1. Check all competition instances and their status
SELECT 
  id,
  instance_number,
  status,
  current_players,
  max_players,
  tournament_id,
  created_at,
  template_id
FROM competition_instances
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check competition entries for these instances
SELECT 
  id,
  instance_id,
  user_id,
  entry_name,
  created_at
FROM competition_entries
WHERE instance_id IN (
  SELECT id FROM competition_instances ORDER BY created_at DESC LIMIT 20
)
ORDER BY instance_id, created_at;

-- 3. Check RLS policies on competition_instances
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'competition_instances';

-- 4. Check RLS policies on competition_entries
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'competition_entries';

-- 5. Test the actual query that the API uses
SELECT 
  ci.id,
  ci.instance_number,
  ci.current_players,
  ci.max_players,
  ci.status,
  ci.entry_fee_pennies,
  ci.created_at,
  ci.tournament_id,
  t.name as tournament_name,
  t.slug as tournament_slug,
  ct.name as template_name,
  ct.short_name,
  ct.rounds_covered,
  ct.admin_fee_percent
FROM competition_instances ci
INNER JOIN tournaments t ON t.id = ci.tournament_id
INNER JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ci.status IN ('pending', 'open')
  AND ci.current_players < 2
ORDER BY ci.created_at DESC
LIMIT 50;

-- 6. Check what statuses actually exist
SELECT DISTINCT status, COUNT(*) as count
FROM competition_instances
GROUP BY status;

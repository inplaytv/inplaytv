-- ===================================================================
-- Check What Entries Are Showing on "My Scorecards" Page
-- This query shows all competition_entries for the current user
-- ===================================================================

-- Replace 'YOUR_USER_ID' with the actual user ID you're testing with
-- For Terry Tibbs, it's likely the user_id shown in previous queries

-- Show all regular competition entries
SELECT 
  'Regular Competition Entries' as entry_type,
  ce.id as entry_id,
  ce.entry_name,
  ce.competition_id,
  tc.competition_type_id,
  t.name as tournament_name,
  ce.created_at,
  ce.user_id
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON tc.id = ce.competition_id
LEFT JOIN tournaments t ON t.id = tc.tournament_id
WHERE ce.user_id = 'YOUR_USER_ID'
  AND ce.competition_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Show all ONE 2 ONE entries
SELECT 
  'ONE 2 ONE Entries' as entry_type,
  ce.id as entry_id,
  ce.entry_name,
  ce.instance_id,
  ci.status as match_status,
  ci.current_players,
  ci.max_players,
  t.name as tournament_name,
  ct.name as template_name,
  ce.created_at,
  ce.user_id
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
LEFT JOIN tournaments t ON t.id = ci.tournament_id
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ce.user_id = 'YOUR_USER_ID'
  AND ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Show orphaned entries (no matching competition or instance)
SELECT 
  'Orphaned Entries' as entry_type,
  ce.id as entry_id,
  ce.entry_name,
  ce.competition_id,
  ce.instance_id,
  ce.created_at,
  ce.user_id
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON tc.id = ce.competition_id
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
WHERE ce.user_id = 'YOUR_USER_ID'
  AND tc.id IS NULL 
  AND ci.id IS NULL
ORDER BY ce.created_at DESC;

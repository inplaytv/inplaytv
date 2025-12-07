/* ===================================================================
   DEBUG: Find ALL references to challenge #A55CA50A
   Check if anything is still in the database
   =================================================================== */

-- Check competition_entries table
SELECT 
  'competition_entries' as source,
  ce.id,
  ce.user_id,
  ce.entry_name,
  ce.competition_id,
  ce.instance_id,
  ce.created_at
FROM competition_entries ce
WHERE ce.instance_id::text LIKE 'a55ca50a%'
   OR ce.id::text LIKE 'a55ca50a%';

-- Check competition_instances table
SELECT 
  'competition_instances' as source,
  ci.id,
  ci.template_id,
  ci.tournament_id,
  ci.status,
  ci.current_players,
  ci.entry_fee_pennies / 100.0 as entry_fee_pounds,
  ci.created_at
FROM competition_instances ci
WHERE ci.id::text LIKE 'a55ca50a%';

-- Check if the entry is linked to a regular competition instead
SELECT 
  'competition_entries_by_id' as source,
  ce.id,
  ce.entry_name,
  ce.competition_id,
  ce.instance_id,
  tc.id as tournament_competition_id,
  t.name as tournament_name
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON ce.competition_id = tc.id
LEFT JOIN tournaments t ON tc.tournament_id = t.id
WHERE ce.id::text LIKE 'a55ca50a%';

-- Show ALL entries for current user (to find which one is showing)
-- Replace 'YOUR_USER_ID' with your actual user ID
-- SELECT 
--   ce.id,
--   SUBSTRING(ce.id::text, 1, 8) as short_id,
--   ce.entry_name,
--   COALESCE(ce.instance_id::text, ce.competition_id::text) as competition_ref,
--   ce.created_at
-- FROM competition_entries ce
-- WHERE ce.user_id = 'YOUR_USER_ID'
-- ORDER BY ce.created_at DESC
-- LIMIT 20;

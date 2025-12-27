-- Check each view definition for rounds_covered reference
-- Run these one at a time in Supabase SQL Editor

SELECT 'v_competition_golfers' as view_name, pg_get_viewdef('v_competition_golfers', true) as definition
UNION ALL
SELECT 'v_entry_teams', pg_get_viewdef('v_entry_teams', true)
UNION ALL
SELECT 'v_tournament_groups', pg_get_viewdef('v_tournament_groups', true)
UNION ALL
SELECT 'v_group_golfers', pg_get_viewdef('v_group_golfers', true);

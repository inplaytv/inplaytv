-- Reset Tournaments - Complete Clean Slate
-- This will remove ALL tournaments and related data

-- Step 1: Delete all competition entries (user entries for tournaments)
DELETE FROM public.competition_entries;

-- Step 2: Delete all entry picks (golfer selections in entries)
DELETE FROM public.entry_picks;

-- Step 3: Delete all competition golfers (golfers assigned to competitions)
DELETE FROM public.competition_golfers;

-- Step 4: Delete all tournament competitions
DELETE FROM public.tournament_competitions;

-- Step 5: Delete all tournaments
DELETE FROM public.tournaments;

-- Verify everything is deleted
SELECT 'Tournaments remaining:' as check_type, COUNT(*) as count FROM public.tournaments
UNION ALL
SELECT 'Competitions remaining:', COUNT(*) FROM public.tournament_competitions
UNION ALL
SELECT 'Competition golfers remaining:', COUNT(*) FROM public.competition_golfers
UNION ALL
SELECT 'Entries remaining:', COUNT(*) FROM public.competition_entries
UNION ALL
SELECT 'Entry picks remaining:', COUNT(*) FROM public.entry_picks;

-- SUCCESS MESSAGE
SELECT '✅ All tournaments and related data have been deleted. You can now create fresh tournaments.' as status;

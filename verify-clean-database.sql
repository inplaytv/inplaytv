-- Verify database is actually clean
SELECT 'tournaments' as table_name, COUNT(*) as count FROM tournaments
UNION ALL
SELECT 'tournament_competitions', COUNT(*) FROM tournament_competitions
UNION ALL
SELECT 'competition_entries', COUNT(*) FROM competition_entries
UNION ALL
SELECT 'entry_picks', COUNT(*) FROM entry_picks
UNION ALL
SELECT 'tournament_golfers', COUNT(*) FROM tournament_golfers
UNION ALL
SELECT 'competition_golfers', COUNT(*) FROM competition_golfers;

-- If any exist, show them
SELECT 
  id,
  name,
  slug,
  status,
  created_at
FROM tournaments
ORDER BY created_at DESC;

SELECT 
  id,
  tournament_id,
  competition_type_id,
  competition_format,
  status,
  created_at
FROM tournament_competitions
ORDER BY created_at DESC;

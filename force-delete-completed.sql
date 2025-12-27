-- Delete completed tournaments - simplified version
-- Only deleting from tables that definitely exist

-- 1. Delete audit logs (has broken FKs, ignore errors)
DELETE FROM tournament_score_audit_log 
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE status = 'completed'
);

-- 2. Delete player round stats (ignore if doesn't exist)
DELETE FROM player_round_stats 
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE status = 'completed'
);

-- 3. Delete tournament golfers
DELETE FROM tournament_golfers 
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE status = 'completed'
);

-- 4. Delete competition entries
DELETE FROM competition_entries 
WHERE competition_id IN (
  SELECT tc.id FROM tournament_competitions tc
  WHERE tc.tournament_id IN (SELECT id FROM tournaments WHERE status = 'completed')
);

-- 5. Delete competition golfers
DELETE FROM competition_golfers 
WHERE competition_id IN (
  SELECT tc.id FROM tournament_competitions tc
  WHERE tc.tournament_id IN (SELECT id FROM tournaments WHERE status = 'completed')
);

-- 6. Delete tournament competitions
DELETE FROM tournament_competitions 
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE status = 'completed'
);

-- 7. Delete the tournaments
DELETE FROM tournaments WHERE status = 'completed';

-- Verify
SELECT name, status FROM tournaments ORDER BY start_date ASC;

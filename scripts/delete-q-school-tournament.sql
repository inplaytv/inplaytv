-- Delete PGA TOUR Q-School tournament and all related data
-- Run this in Supabase SQL Editor
-- Tournament ID: 8210549e-bd84-470a-9f30-c0ea49e36ad0

DELETE FROM entry_picks WHERE entry_id IN (
  SELECT id FROM competition_entries WHERE competition_id IN (
    SELECT id FROM tournament_competitions WHERE tournament_id = '8210549e-bd84-470a-9f30-c0ea49e36ad0'
  )
);

DELETE FROM competition_entries WHERE competition_id IN (
  SELECT id FROM tournament_competitions WHERE tournament_id = '8210549e-bd84-470a-9f30-c0ea49e36ad0'
);

DELETE FROM competition_results WHERE competition_id IN (
  SELECT id FROM tournament_competitions WHERE tournament_id = '8210549e-bd84-470a-9f30-c0ea49e36ad0'
);

DELETE FROM tournament_competitions WHERE tournament_id = '8210549e-bd84-470a-9f30-c0ea49e36ad0';

DELETE FROM tournament_golfers WHERE tournament_id = '8210549e-bd84-470a-9f30-c0ea49e36ad0';

DELETE FROM tournaments WHERE id = '8210549e-bd84-470a-9f30-c0ea49e36ad0';

-- Verify deletion
SELECT COUNT(*) FROM tournaments WHERE name LIKE '%Q-School%';

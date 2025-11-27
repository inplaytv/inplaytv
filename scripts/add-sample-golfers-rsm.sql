-- Add sample golfers to RSM Classic for testing
-- Using realistic Round 4 scenario with various scores

INSERT INTO golfers (first_name, last_name, country, datagolf_id, owgr, created_at, updated_at)
VALUES
  ('Scottie', 'Scheffler', 'USA', 9478, 1, NOW(), NOW()),
  ('Rory', 'McIlroy', 'NIR', 8793, 2, NOW(), NOW()),
  ('Jon', 'Rahm', 'ESP', 8849, 3, NOW(), NOW()),
  ('Viktor', 'Hovland', 'NOR', 11159, 4, NOW(), NOW()),
  ('Xander', 'Schauffele', 'USA', 9670, 5, NOW(), NOW()),
  ('Collin', 'Morikawa', 'USA', 11621, 6, NOW(), NOW()),
  ('Patrick', 'Cantlay', 'USA', 8789, 7, NOW(), NOW()),
  ('Tony', 'Finau', 'USA', 8917, 8, NOW(), NOW()),
  ('Tommy', 'Fleetwood', 'ENG', 8848, 9, NOW(), NOW()),
  ('Max', 'Homa', 'USA', 11164, 10, NOW(), NOW()),
  ('Jordan', 'Spieth', 'USA', 8972, 11, NOW(), NOW()),
  ('Justin', 'Thomas', 'USA', 9467, 12, NOW(), NOW())
ON CONFLICT (datagolf_id) DO NOTHING;

-- Add them to RSM Classic tournament with realistic R1-R3 scores
INSERT INTO tournament_golfers (tournament_id, golfer_id, r1_score, r2_score, r3_score, r4_score, total_score, position, created_at, updated_at)
SELECT 
  'd9cdd4d8-75bc-401c-9472-c297bfa718ce',
  g.id,
  CASE g.last_name
    WHEN 'Scheffler' THEN -6
    WHEN 'McIlroy' THEN -5
    WHEN 'Rahm' THEN -5
    WHEN 'Hovland' THEN -4
    WHEN 'Schauffele' THEN -4
    WHEN 'Morikawa' THEN -3
    WHEN 'Cantlay' THEN -3
    WHEN 'Finau' THEN -2
    WHEN 'Fleetwood' THEN -2
    WHEN 'Homa' THEN -1
    WHEN 'Spieth' THEN -1
    WHEN 'Thomas' THEN 0
  END,
  CASE g.last_name
    WHEN 'Scheffler' THEN -5
    WHEN 'McIlroy' THEN -6
    WHEN 'Rahm' THEN -4
    WHEN 'Hovland' THEN -5
    WHEN 'Schauffele' THEN -4
    WHEN 'Morikawa' THEN -5
    WHEN 'Cantlay' THEN -4
    WHEN 'Finau' THEN -5
    WHEN 'Fleetwood' THEN -3
    WHEN 'Homa' THEN -4
    WHEN 'Spieth' THEN -2
    WHEN 'Thomas' THEN -3
  END,
  CASE g.last_name
    WHEN 'Scheffler' THEN -4
    WHEN 'McIlroy' THEN -4
    WHEN 'Rahm' THEN -5
    WHEN 'Hovland' THEN -4
    WHEN 'Schauffele' THEN -5
    WHEN 'Morikawa' THEN -4
    WHEN 'Cantlay' THEN -4
    WHEN 'Finau' THEN -3
    WHEN 'Fleetwood' THEN -4
    WHEN 'Homa' THEN -3
    WHEN 'Spieth' THEN -4
    WHEN 'Thomas' THEN -2
  END,
  NULL, -- R4 hasn't been played yet
  NULL, -- total will be calculated after R4
  NULL, -- position will be calculated after R4
  NOW(),
  NOW()
FROM golfers g
WHERE g.datagolf_id IN (9478, 8793, 8849, 11159, 9670, 11621, 8789, 8917, 8848, 11164, 8972, 9467);

-- Verify the golfers were added
SELECT 
  g.first_name || ' ' || g.last_name as name,
  tg.r1_score,
  tg.r2_score,
  tg.r3_score,
  (tg.r1_score + tg.r2_score + tg.r3_score) as total_thru_3
FROM tournament_golfers tg
JOIN golfers g ON tg.golfer_id = g.id
WHERE tg.tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
ORDER BY (tg.r1_score + tg.r2_score + tg.r3_score) ASC;

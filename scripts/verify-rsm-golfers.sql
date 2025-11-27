-- Verify the RSM Classic golfers were added successfully
SELECT 
  g.name,
  g.country,
  g.datagolf_id,
  tg.r1_score,
  tg.r2_score,
  tg.r3_score,
  tg.total_score,
  tg.position
FROM tournament_golfers tg
JOIN golfers g ON tg.golfer_id = g.id
WHERE tg.tournament_id = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce'
ORDER BY tg.total_score ASC NULLS LAST
LIMIT 25;

-- Quick check: Do golfers have world_rank values?
SELECT 
  id,
  first_name,
  last_name,
  full_name,
  world_rank,
  skill_rating,
  last_ranking_update
FROM golfers
WHERE last_name IN ('Aberg', 'Scheffler', 'McIlroy', 'Rahm')
ORDER BY last_name;

-- Count how many golfers have rankings
SELECT 
  COUNT(*) as total_golfers,
  COUNT(world_rank) as golfers_with_rankings
FROM golfers;

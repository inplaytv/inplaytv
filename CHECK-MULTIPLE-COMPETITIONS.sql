-- Check if multiple competitions exist for Alfred Dunhill Championship
-- This would explain why 329 golfers show instead of 156

-- Get the tournament
SELECT id, name 
FROM tournaments 
WHERE slug = 'alfred-dunhill-championship';

-- Check how many competitions exist for this tournament
SELECT 
  tc.id,
  tc.name,
  tc.tournament_id,
  tc.competition_type,
  tc.max_entries,
  tc.entry_fee_pence,
  tc.prize_pool_pence,
  tc.status
FROM tournament_competitions tc
JOIN tournaments t ON t.id = tc.tournament_id
WHERE t.slug = 'alfred-dunhill-championship';

-- Check tournament_golfers groups
SELECT 
  tg.golfer_group_id,
  gg.name as group_name,
  COUNT(*) as golfer_count
FROM tournament_golfers tg
LEFT JOIN golfer_groups gg ON gg.id = tg.golfer_group_id
JOIN tournaments t ON t.id = tg.tournament_id
WHERE t.slug = 'alfred-dunhill-championship'
GROUP BY tg.golfer_group_id, gg.name
ORDER BY golfer_count DESC;

-- Total unique golfers for this tournament
SELECT 
  COUNT(*) as total_golfers,
  COUNT(DISTINCT golfer_id) as unique_golfers
FROM tournament_golfers tg
JOIN tournaments t ON t.id = tg.tournament_id
WHERE t.slug = 'alfred-dunhill-championship';

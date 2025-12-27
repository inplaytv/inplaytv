-- Check if entry was created for THE WEEKENDER competition
SELECT 
  ce.id,
  ce.user_id,
  ce.entry_name,
  ce.total_salary,
  ce.entry_fee_paid,
  ce.status,
  ce.created_at,
  COUNT(cep.id) as num_picks
FROM competition_entries ce
LEFT JOIN competition_entry_picks cep ON ce.id = cep.entry_id
WHERE ce.competition_id = '686e42b9-e2b5-42c3-90d6-fabae22b2e37'
GROUP BY ce.id, ce.user_id, ce.entry_name, ce.total_salary, ce.entry_fee_paid, ce.status, ce.created_at
ORDER BY ce.created_at DESC
LIMIT 5;

-- Also check the picks details
SELECT 
  ce.id as entry_id,
  g.full_name as golfer_name,
  cep.slot_position,
  cep.salary_at_selection,
  ce.captain_golfer_id = cep.golfer_id as is_captain
FROM competition_entries ce
JOIN competition_entry_picks cep ON ce.id = cep.entry_id
JOIN golfers g ON cep.golfer_id = g.id
WHERE ce.competition_id = '686e42b9-e2b5-42c3-90d6-fabae22b2e37'
ORDER BY ce.created_at DESC, cep.slot_position
LIMIT 20;

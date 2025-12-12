-- Diagnostic: Check what admin entries still exist

-- 1. Check competition_entries table
SELECT 
  ce.id as entry_id,
  ce.competition_id,
  ce.user_id,
  ce.entry_name,
  ce.status,
  ce.created_at
FROM competition_entries ce
WHERE ce.user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
ORDER BY ce.created_at DESC;

-- 2. Check competition_entry_picks (the actual golfer selections)
SELECT 
  cep.id as pick_id,
  cep.entry_id,
  cep.golfer_id,
  cep.slot_position,
  cep.is_captain,
  g.name as golfer_name
FROM competition_entry_picks cep
LEFT JOIN golfers g ON g.id = cep.golfer_id
WHERE cep.entry_id IN (
  SELECT id FROM competition_entries 
  WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
)
ORDER BY cep.entry_id, cep.slot_position;

-- 3. Check if there are orphaned picks (picks without parent entry)
SELECT 
  cep.id as pick_id,
  cep.entry_id,
  cep.golfer_id,
  g.name as golfer_name
FROM competition_entry_picks cep
LEFT JOIN golfers g ON g.id = cep.golfer_id
LEFT JOIN competition_entries ce ON ce.id = cep.entry_id
WHERE ce.id IS NULL;

-- ===================================================================
-- CHECK IF ENTRIES ARE ACTUALLY BEING CREATED
-- Verify the most recent entry exists
-- ===================================================================

-- Check all entries for this user
SELECT 
  id,
  competition_id,
  entry_name,
  total_salary,
  entry_fee_paid,
  status,
  created_at
FROM competition_entries
WHERE user_id = '722a6137-e43a-4184-b31e-eb0fea2f6dff'
ORDER BY created_at DESC;

-- Check if the specific entry from the console exists
SELECT *
FROM competition_entries
WHERE id = '9a5f0e14-f95d-4fda-970d-faac0a5845c3';

-- Check entry_picks for this entry
SELECT *
FROM entry_picks
WHERE entry_id = '9a5f0e14-f95d-4fda-970d-faac0a5845c3';

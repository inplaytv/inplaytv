-- ===================================================================
-- DELETE ALL Test Entries for a Specific User
-- This removes ALL competition entries (regular + ONE 2 ONE) for testing
-- ===================================================================

-- IMPORTANT: Replace 'YOUR_USER_ID' with the actual user ID
-- You can find user IDs by running:
-- SELECT id, email, display_name FROM profiles WHERE email LIKE '%test%' OR display_name LIKE '%test%';

-- Step 1: Show what will be deleted - Regular Competition Entries
SELECT 
  'Regular Entries to Delete' as info,
  ce.id as entry_id,
  ce.entry_name,
  t.name as tournament_name,
  tc.competition_type_id,
  ce.created_at
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON tc.id = ce.competition_id
LEFT JOIN tournaments t ON t.id = tc.tournament_id
WHERE ce.user_id = 'YOUR_USER_ID'
  AND ce.competition_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Step 2: Show what will be deleted - ONE 2 ONE Entries
SELECT 
  'ONE 2 ONE Entries to Delete' as info,
  ce.id as entry_id,
  ce.entry_name,
  t.name as tournament_name,
  ct.name as template_name,
  ci.status as match_status,
  ce.created_at
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
LEFT JOIN tournaments t ON t.id = ci.tournament_id
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ce.user_id = 'YOUR_USER_ID'
  AND ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC;

-- Step 3: Delete entry picks first (foreign key)
DELETE FROM entry_picks
WHERE entry_id IN (
  SELECT id FROM competition_entries WHERE user_id = 'YOUR_USER_ID'
);

-- Step 4: Delete the competition entries
DELETE FROM competition_entries
WHERE user_id = 'YOUR_USER_ID';

-- Step 5: Verify deletion
SELECT 
  'Remaining entries for user' as info,
  COUNT(*) as count
FROM competition_entries
WHERE user_id = 'YOUR_USER_ID';

-- Optional: Clean up orphaned ONE 2 ONE instances where user was the only player
-- (This deletes matches where current_players <= 1)
DELETE FROM competition_instances
WHERE id IN (
  SELECT ci.id 
  FROM competition_instances ci
  LEFT JOIN competition_entries ce ON ce.instance_id = ci.id
  WHERE ci.current_players <= 1
    AND ce.id IS NULL  -- No entries left
);

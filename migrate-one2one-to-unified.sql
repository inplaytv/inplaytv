-- MIGRATION: Move ONE 2 ONE challenges from competition_instances to tournament_competitions
-- This completes the unified competition table migration

BEGIN;

-- Step 1: Insert all competition_instances into tournament_competitions
INSERT INTO tournament_competitions (
  id,
  tournament_id,
  competition_type_id,
  entry_fee_pennies,
  entrants_cap,
  status,
  created_at,
  updated_at,
  start_at,
  end_at,
  reg_open_at,
  reg_close_at,
  competition_format,
  rounds_covered,
  admin_fee_percent,
  max_players,
  current_players,
  winner_entry_id
)
SELECT 
  id,
  tournament_id,
  NULL as competition_type_id, -- ONE 2 ONE doesn't use competition_type_id
  entry_fee_pennies,
  2 as entrants_cap, -- ONE 2 ONE always has exactly 2 players
  status,
  created_at,
  updated_at,
  start_at,
  end_at,
  reg_open_at,
  reg_close_at,
  'one2one' as competition_format,
  rounds_covered,
  10 as admin_fee_percent,
  2 as max_players,
  COALESCE(current_players, 0) as current_players,
  winner_entry_id
FROM competition_instances
ON CONFLICT (id) DO UPDATE SET
  tournament_id = EXCLUDED.tournament_id,
  entry_fee_pennies = EXCLUDED.entry_fee_pennies,
  status = EXCLUDED.status,
  start_at = EXCLUDED.start_at,
  end_at = EXCLUDED.end_at,
  reg_open_at = EXCLUDED.reg_open_at,
  reg_close_at = EXCLUDED.reg_close_at,
  competition_format = 'one2one',
  rounds_covered = EXCLUDED.rounds_covered,
  max_players = EXCLUDED.max_players,
  current_players = EXCLUDED.current_players,
  winner_entry_id = EXCLUDED.winner_entry_id,
  updated_at = NOW();

-- Step 2: Update competition_entries to use competition_id instead of instance_id
UPDATE competition_entries
SET competition_id = instance_id
WHERE instance_id IS NOT NULL
  AND competition_id IS NULL;

-- Step 3: Clear instance_id after migration
UPDATE competition_entries
SET instance_id = NULL
WHERE instance_id IS NOT NULL
  AND competition_id IS NOT NULL;

-- Step 4: Show migration results
SELECT 
  'Migrated Competitions' as item,
  COUNT(*) as count
FROM tournament_competitions
WHERE competition_format = 'one2one'
UNION ALL
SELECT 
  'Updated Entries' as item,
  COUNT(*) as count
FROM competition_entries
WHERE competition_id IN (
  SELECT id FROM tournament_competitions WHERE competition_format = 'one2one'
);

COMMIT;

-- Verification queries
SELECT '=== VERIFICATION ===' as status;

-- Check all ONE 2 ONE competitions
SELECT 
  id,
  tournament_id,
  status,
  competition_format,
  array_length(rounds_covered, 1) as num_rounds,
  max_players,
  current_players,
  created_at
FROM tournament_competitions
WHERE competition_format = 'one2one'
ORDER BY created_at DESC
LIMIT 10;

-- Check entries are linked correctly
SELECT 
  ce.id as entry_id,
  ce.competition_id,
  ce.user_id,
  ce.tournament_id,
  tc.competition_format,
  tc.current_playersn_name,
  tc.competition_format
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
WHERE tc.competition_format = 'one2one'
ORDER BY ce.created_at DESC
LIMIT 10;

-- Check for orphaned entries (should be 0)
SELECT COUNT(*) as orphaned_entries
FROM competition_entries
WHERE instance_id IS NOT NULL;

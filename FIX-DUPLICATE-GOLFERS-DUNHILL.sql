-- ===================================================================
-- EMERGENCY FIX: Remove Duplicate Golfers from Alfred Dunhill Championship
-- Tournament should have 156 unique golfers, currently has 329 total
-- ===================================================================

-- First, let's see what we're dealing with
DO $$ 
DECLARE
  total_count INTEGER;
  unique_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT golfer_id) 
  INTO total_count, unique_count
  FROM tournament_golfers
  WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';
  
  duplicate_count := total_count - unique_count;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 DUPLICATE GOLFER ANALYSIS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total entries: %', total_count;
  RAISE NOTICE 'Unique golfers: %', unique_count;
  RAISE NOTICE 'Duplicate entries: %', duplicate_count;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Remove duplicates, keeping only the MOST RECENT entry for each golfer
-- This preserves the latest data while removing older duplicates
DELETE FROM tournament_golfers tg1
WHERE id IN (
  SELECT tg2.id
  FROM tournament_golfers tg2
  WHERE tg2.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
    AND tg2.id NOT IN (
      -- Keep only the most recent entry for each golfer
      SELECT DISTINCT ON (golfer_id) id
      FROM tournament_golfers
      WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
      ORDER BY golfer_id, created_at DESC
    )
);

-- Verify the fix
DO $$ 
DECLARE
  final_count INTEGER;
  final_unique INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT golfer_id) 
  INTO final_count, final_unique
  FROM tournament_golfers
  WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CLEANUP COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Remaining entries: %', final_count;
  RAISE NOTICE 'Unique golfers: %', final_unique;
  
  IF final_count = final_unique THEN
    RAISE NOTICE '✅ SUCCESS: All duplicates removed!';
  ELSE
    RAISE WARNING '⚠️  WARNING: Still % duplicates remaining', (final_count - final_unique);
  END IF;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Show final golfer list summary
SELECT 
  'Alfred Dunhill Championship' as tournament,
  COUNT(*) as total_golfers,
  MIN(created_at) as oldest_entry,
  MAX(created_at) as newest_entry
FROM tournament_golfers
WHERE tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';

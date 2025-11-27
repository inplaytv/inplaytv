-- Cleanup Corrupted Golfers
-- This script removes golfers with corrupted data (likely from uploading Excel files as CSV)
-- Run this in Supabase SQL Editor

-- Step 1: View corrupted golfers (DO NOT DELETE YET - just preview)
SELECT 
  id, 
  first_name, 
  last_name, 
  full_name,
  length(full_name) as name_length
FROM golfers
WHERE 
  -- Detect binary/control characters
  full_name ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'
  OR full_name LIKE '%PK!%'
  OR full_name LIKE '%xl/%'
  OR full_name LIKE '%Content_Types%'
  OR full_name LIKE '%worksheets%'
  OR full_name LIKE '%docProps%'
  -- Very long names (likely binary dump)
  OR length(full_name) > 100
  -- Names with weird characters
  OR first_name ~ '[^a-zA-Z\s\-''.()]'
  OR last_name ~ '[^a-zA-Z\s\-''.()]';

-- Step 2: Count how many will be deleted
SELECT COUNT(*) as corrupted_count
FROM golfers
WHERE 
  full_name ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'
  OR full_name LIKE '%PK!%'
  OR full_name LIKE '%xl/%'
  OR full_name LIKE '%Content_Types%'
  OR full_name LIKE '%worksheets%'
  OR full_name LIKE '%docProps%'
  OR length(full_name) > 100
  OR first_name ~ '[^a-zA-Z\s\-''.()]'
  OR last_name ~ '[^a-zA-Z\s\-''.()]';

-- Step 3: ACTUAL DELETION (Uncomment when ready)
-- WARNING: This will permanently delete corrupted golfers!

/*
BEGIN;

-- Delete from group_members first (foreign key constraint)
DELETE FROM group_members
WHERE golfer_id IN (
  SELECT id FROM golfers
  WHERE 
    full_name ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'
    OR full_name LIKE '%PK!%'
    OR full_name LIKE '%xl/%'
    OR full_name LIKE '%Content_Types%'
    OR full_name LIKE '%worksheets%'
    OR full_name LIKE '%docProps%'
    OR length(full_name) > 100
    OR first_name ~ '[^a-zA-Z\s\-''.()]'
    OR last_name ~ '[^a-zA-Z\s\-''.()]'
);

-- Delete from golfer_ranking_history (if exists)
DELETE FROM golfer_ranking_history
WHERE golfer_id IN (
  SELECT id FROM golfers
  WHERE 
    full_name ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'
    OR full_name LIKE '%PK!%'
    OR full_name LIKE '%xl/%'
    OR full_name LIKE '%Content_Types%'
    OR full_name LIKE '%worksheets%'
    OR full_name LIKE '%docProps%'
    OR length(full_name) > 100
    OR first_name ~ '[^a-zA-Z\s\-''.()]'
    OR last_name ~ '[^a-zA-Z\s\-''.()]'
);

-- Now delete the corrupted golfers
DELETE FROM golfers
WHERE 
  full_name ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'
  OR full_name LIKE '%PK!%'
  OR full_name LIKE '%xl/%'
  OR full_name LIKE '%Content_Types%'
  OR full_name LIKE '%worksheets%'
  OR full_name LIKE '%docProps%'
  OR length(full_name) > 100
  OR first_name ~ '[^a-zA-Z\s\-''.()]'
  OR last_name ~ '[^a-zA-Z\s\-''.()]';

COMMIT;
*/

-- Step 4: Fix golfers with ranking numbers in last name
-- Example: "Scheffler 1" should be "Scheffler" with world_rank = 1

-- Preview golfers with numbers in last name
SELECT 
  id,
  first_name,
  last_name,
  full_name,
  world_rank,
  -- Extract potential ranking from last name
  CASE 
    WHEN last_name ~ '\s+\d+$' THEN 
      (regexp_match(last_name, '\s+(\d+)$'))[1]::int
    ELSE NULL
  END as extracted_rank
FROM golfers
WHERE last_name ~ '\s+\d+$'
AND world_rank IS NULL;

-- Fix them (Uncomment when ready)
/*
BEGIN;

-- Update golfers where last name contains a number at the end
UPDATE golfers
SET 
  last_name = regexp_replace(last_name, '\s+\d+$', ''),
  world_rank = (regexp_match(last_name, '\s+(\d+)$'))[1]::int,
  last_ranking_update = NOW(),
  ranking_source = 'manual'
WHERE last_name ~ '\s+\d+$'
AND world_rank IS NULL;

COMMIT;
*/

-- Step 5: Verify cleanup
SELECT 
  COUNT(*) as total_golfers,
  COUNT(CASE WHEN world_rank IS NOT NULL THEN 1 END) as with_ranking,
  COUNT(CASE WHEN world_rank IS NULL THEN 1 END) as without_ranking,
  MIN(length(full_name)) as shortest_name,
  MAX(length(full_name)) as longest_name
FROM golfers;

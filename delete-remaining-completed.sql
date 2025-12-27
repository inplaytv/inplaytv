-- Delete 8 completed tournaments and ALL related data
-- Run this in Supabase SQL Editor

-- Disable triggers temporarily to bypass FK constraints
SET session_replication_role = replica;

-- Delete tournaments by ID
DELETE FROM tournaments WHERE id IN (
  'd9cdd4d8-75bc-401c-9472-c297bfa718ce', -- The RSM Classic
  'a52180df-9e00-4a93-a4c5-b29f00da3522', -- BMW Australian PGA Championship
  'f091f409-8e88-437a-a97a-342b8f3c0ba0', -- Alfred Dunhill Championship  
  '1da3c41c-c9eb-4702-9245-1f774ca560e5', -- PGA TOUR Q-School
  '2856ed7c-3c80-4cab-b1bc-f40cdc6a080c'  -- AfrAsia Bank Mauritius Open
);

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Show remaining tournaments
SELECT name, status, created_at FROM tournaments ORDER BY start_date ASC;

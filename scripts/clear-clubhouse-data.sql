-- Clear All Clubhouse Data (for testing fresh start)
-- Run this in Supabase SQL Editor

-- Delete in correct order to avoid foreign key violations
DELETE FROM clubhouse_entries;
DELETE FROM clubhouse_credit_transactions;
DELETE FROM clubhouse_competitions;
DELETE FROM clubhouse_events;

-- Verify all cleared
SELECT 'clubhouse_entries' as table_name, COUNT(*) as remaining FROM clubhouse_entries
UNION ALL
SELECT 'clubhouse_credit_transactions', COUNT(*) FROM clubhouse_credit_transactions
UNION ALL
SELECT 'clubhouse_competitions', COUNT(*) FROM clubhouse_competitions
UNION ALL
SELECT 'clubhouse_events', COUNT(*) FROM clubhouse_events;

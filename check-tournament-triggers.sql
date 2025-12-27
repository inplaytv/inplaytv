-- Check for triggers on tournaments table
-- Run this in Supabase SQL Editor

SELECT 
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS enabled,
    proname AS function_name,
    prosrc AS function_source
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'tournaments'
AND tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
AND tgname NOT LIKE 'pg_%'  -- Exclude system triggers
ORDER BY tgname;

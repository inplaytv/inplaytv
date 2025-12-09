-- ============================================
-- FIX: Add 'pending' to competition_instances status constraint
-- ============================================
-- The database check constraint needs to be updated to allow 'pending' status
--
-- Current constraint only allows: 'open', 'full', 'active', 'completed', 'cancelled'
-- We need to add: 'pending'
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the old constraint
ALTER TABLE competition_instances 
DROP CONSTRAINT IF EXISTS competition_instances_status_check;

-- Add new constraint with 'pending' included
ALTER TABLE competition_instances
ADD CONSTRAINT competition_instances_status_check 
CHECK (status IN ('pending', 'open', 'full', 'active', 'completed', 'cancelled'));

-- Verify the constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'competition_instances_status_check';

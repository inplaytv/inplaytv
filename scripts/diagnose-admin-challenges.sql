-- Find admin user ID first
SELECT 
  au.id, 
  au.email,
  p.username
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email ILIKE '%admin%'
LIMIT 5;

-- Check all competition entries for admin user
-- Replace 'YOUR_ADMIN_USER_ID' with the actual ID from above
SELECT 
  ce.id as entry_id,
  ce.user_id,
  ce.instance_id,
  ce.competition_id,
  ce.created_at,
  ce.entry_fee_paid
FROM competition_entries ce
WHERE ce.user_id = 'YOUR_ADMIN_USER_ID'
ORDER BY ce.created_at DESC;

-- Check the instances (challenges) status
SELECT 
  ci.id as instance_id,
  ci.template_id,
  ci.status,
  ci.current_players,
  ci.max_players,
  ci.entry_fee_pennies,
  ci.created_at,
  ct.name as template_name,
  ct.admin_fee_percent
FROM competition_instances ci
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
ORDER BY ci.created_at DESC
LIMIT 10;

-- Check for any entries pointing to these instances
SELECT 
  ce.id as entry_id,
  ce.user_id,
  ce.instance_id,
  ci.status as instance_status,
  ci.current_players,
  ci.max_players,
  ct.name as challenge_name
FROM competition_entries ce
LEFT JOIN competition_instances ci ON ci.id = ce.instance_id
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ce.instance_id IS NOT NULL
ORDER BY ce.created_at DESC
LIMIT 10;

-- Fix any challenges marked as 'full' when they should be 'open'
-- Run this AFTER reviewing the data above
UPDATE competition_instances
SET status = 'open', current_players = 1
WHERE status = 'full' 
  AND current_players <= 1
  AND max_players = 2;

-- Verify the fix
SELECT 
  ci.id,
  ci.status,
  ci.current_players,
  ci.max_players,
  ct.name
FROM competition_instances ci
LEFT JOIN competition_templates ct ON ct.id = ci.template_id
WHERE ci.status = 'open'
ORDER BY ci.created_at DESC;

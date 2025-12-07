/* ===================================================================
   DELETE Challenge #A55CA50A and its entries
   =================================================================== */

-- Step 1: Check what will be deleted
SELECT 
  'competition_entries' as table_name,
  ce.id,
  ce.entry_name,
  p.username,
  ci.entry_fee_pennies / 100.0 as entry_fee_pounds
FROM competition_entries ce
LEFT JOIN profiles p ON ce.user_id = p.id
JOIN competition_instances ci ON ce.instance_id = ci.id
WHERE ci.id::text LIKE 'a55ca50a%'

UNION ALL

SELECT 
  'competition_instances' as table_name,
  ci.id,
  ct.short_name as entry_name,
  NULL as username,
  ci.entry_fee_pennies / 100.0 as entry_fee_pounds
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
WHERE ci.id::text LIKE 'a55ca50a%';

-- Step 2: Delete entries first (foreign key constraint)
DELETE FROM competition_entries 
WHERE instance_id IN (
  SELECT id FROM competition_instances WHERE id::text LIKE 'a55ca50a%'
);

-- Step 3: Delete the challenge instance
DELETE FROM competition_instances 
WHERE id::text LIKE 'a55ca50a%';

-- Step 4: Verify deletion
SELECT COUNT(*) as remaining_challenges
FROM competition_instances 
WHERE id::text LIKE 'a55ca50a%';

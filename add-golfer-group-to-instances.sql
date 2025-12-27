-- STREAMLINED COMPETITION SYSTEM
-- Make ONE 2 ONE and InPlay competitions work identically
-- Both will have assigned_golfer_group_id stored directly on their table

-- Step 1: Add the missing column
ALTER TABLE competition_instances
ADD COLUMN IF NOT EXISTS assigned_golfer_group_id UUID REFERENCES golfer_groups(id);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_competition_instances_golfer_group 
ON competition_instances(assigned_golfer_group_id);

-- Step 3: Backfill existing instances
-- Copy golfer_group_id from InPlay competitions of the same tournament
UPDATE competition_instances ci
SET assigned_golfer_group_id = (
  SELECT tc.assigned_golfer_group_id
  FROM tournament_competitions tc
  WHERE tc.tournament_id = ci.tournament_id
  AND tc.assigned_golfer_group_id IS NOT NULL
  LIMIT 1
)
WHERE ci.assigned_golfer_group_id IS NULL;

-- Step 4: Verify the update
SELECT 
  ci.id,
  ct.name as template_name,
  t.name as tournament_name,
  ci.assigned_golfer_group_id,
  gg.name as golfer_group_name,
  CASE 
    WHEN ci.assigned_golfer_group_id IS NOT NULL THEN '✅ Has golfer group'
    ELSE '❌ Missing golfer group'
  END as status
FROM competition_instances ci
LEFT JOIN competition_templates ct ON ci.template_id = ct.id
LEFT JOIN tournaments t ON ci.tournament_id = t.id
LEFT JOIN golfer_groups gg ON ci.assigned_golfer_group_id = gg.id
ORDER BY ci.created_at DESC
LIMIT 10;

-- Add golfer group support to clubhouse competitions
-- This allows clubhouse to share the same golfer group system as InPlay

-- Add assigned_golfer_group_id column to clubhouse_competitions
ALTER TABLE clubhouse_competitions
ADD COLUMN IF NOT EXISTS assigned_golfer_group_id UUID REFERENCES golfer_groups(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_clubhouse_competitions_golfer_group 
ON clubhouse_competitions(assigned_golfer_group_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clubhouse_competitions'
AND column_name = 'assigned_golfer_group_id';

-- Show all clubhouse competitions with their golfer group status
SELECT 
  cc.id,
  cc.name,
  cc.assigned_golfer_group_id,
  gg.name as golfer_group_name,
  (SELECT COUNT(*) FROM golfer_group_members WHERE group_id = cc.assigned_golfer_group_id) as golfer_count
FROM clubhouse_competitions cc
LEFT JOIN golfer_groups gg ON cc.assigned_golfer_group_id = gg.id
ORDER BY cc.created_at DESC;

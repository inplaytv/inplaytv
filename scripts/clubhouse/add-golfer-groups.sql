-- Add golfer group support to clubhouse competitions
-- This allows admins to restrict which golfers are available for each competition
-- Same system as InPlay tournaments

-- Add the column
ALTER TABLE clubhouse_competitions 
  ADD COLUMN IF NOT EXISTS assigned_golfer_group_id UUID REFERENCES golfer_groups(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_clubhouse_competitions_golfer_group 
  ON clubhouse_competitions(assigned_golfer_group_id);

-- Optional: Add column to events level too (for bulk assignment to all competitions)
ALTER TABLE clubhouse_events
  ADD COLUMN IF NOT EXISTS default_golfer_group_id UUID REFERENCES golfer_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clubhouse_events_golfer_group 
  ON clubhouse_events(default_golfer_group_id);

COMMENT ON COLUMN clubhouse_competitions.assigned_golfer_group_id IS 
  'Restricts competition to golfers in this group. NULL = all golfers available.';

COMMENT ON COLUMN clubhouse_events.default_golfer_group_id IS 
  'Default golfer group for new competitions in this event. Can be overridden per competition.';

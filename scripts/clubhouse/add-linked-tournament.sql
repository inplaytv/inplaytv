-- Add Tournament Linking to Clubhouse Events
-- Allows clubhouse events to automatically inherit golfer groups from InPlay tournaments
-- When a linked tournament syncs from DataGolf, the clubhouse event gets the same golfer group

-- 1. Add linked_tournament_id column to clubhouse_events
ALTER TABLE clubhouse_events
  ADD COLUMN IF NOT EXISTS linked_tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clubhouse_events_linked_tournament 
  ON clubhouse_events(linked_tournament_id);

-- 3. Add documentation
COMMENT ON COLUMN clubhouse_events.linked_tournament_id IS 
'Optional: Link to InPlay tournament for automatic golfer data sync. When the tournament syncs from DataGolf, this clubhouse event automatically inherits the golfer group. Manual group assignment still works if this is NULL.';

-- 4. Verify the change
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clubhouse_events'
  AND column_name = 'linked_tournament_id';

-- 5. Show existing events (will be NULL until admins link them)
SELECT 
  id,
  name,
  linked_tournament_id,
  default_golfer_group_id,
  status
FROM clubhouse_events
ORDER BY created_at DESC
LIMIT 10;

-- SUCCESS! Now clubhouse events can optionally link to tournaments
-- Next steps:
-- 1. Admin UI will show tournament dropdown when creating/editing events
-- 2. InPlay sync will auto-assign golfer groups to linked clubhouse events
-- 3. Manual group assignment still works as fallback

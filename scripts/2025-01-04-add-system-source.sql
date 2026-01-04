-- System Separation Safeguards: Database Schema Changes
-- Adds system_source column to both tournaments and clubhouse_events tables
-- This prevents confusion when both systems have similarly named events

-- 1. Add system_source to tournaments (InPlay system)
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS system_source TEXT NOT NULL DEFAULT 'inplay'
CHECK (system_source IN ('inplay'));

COMMENT ON COLUMN tournaments.system_source IS 
'System identifier: always "inplay" for tournament system. Used to distinguish from Clubhouse events.';

-- 2. Add system_source to clubhouse_events (Clubhouse system)
ALTER TABLE clubhouse_events
ADD COLUMN IF NOT EXISTS system_source TEXT NOT NULL DEFAULT 'clubhouse'
CHECK (system_source IN ('clubhouse'));

COMMENT ON COLUMN clubhouse_events.system_source IS 
'System identifier: always "clubhouse" for Clubhouse system. Used to distinguish from InPlay tournaments.';

-- 3. Create indexes for faster querying by system
CREATE INDEX IF NOT EXISTS idx_tournaments_system_source 
ON tournaments(system_source);

CREATE INDEX IF NOT EXISTS idx_clubhouse_events_system_source 
ON clubhouse_events(system_source);

-- 4. Update RLS policies to include system_source (if needed)
-- Note: This is mostly for documentation - both systems are already separate

-- 5. Verify the changes
SELECT 
  'tournaments' as table_name,
  COUNT(*) as count,
  system_source
FROM tournaments
GROUP BY system_source
UNION ALL
SELECT 
  'clubhouse_events' as table_name,
  COUNT(*) as count,
  system_source
FROM clubhouse_events
GROUP BY system_source;

-- 6. Add helpful view for finding potential naming conflicts
CREATE OR REPLACE VIEW v_potential_name_conflicts AS
SELECT 
  t.name as tournament_name,
  t.id as tournament_id,
  'inplay' as system,
  ce.name as clubhouse_name,
  ce.id as clubhouse_id,
  'clubhouse' as clubhouse_system
FROM tournaments t
INNER JOIN clubhouse_events ce 
  ON LOWER(t.name) = LOWER(ce.name)
  OR LOWER(t.name) LIKE '%' || LOWER(ce.name) || '%'
  OR LOWER(ce.name) LIKE '%' || LOWER(t.name) || '%';

COMMENT ON VIEW v_potential_name_conflicts IS 
'Identifies tournaments and clubhouse events with similar names that could be confused. Review this regularly.';

-- Test query
-- SELECT * FROM v_potential_name_conflicts;

-- ============================================================================
-- Rename Clubhouse Competitions to Simple Names
-- ============================================================================
-- Run this in Supabase SQL Editor to rename competitions
-- ============================================================================

-- Update competition names for ALL events
-- We'll rename by position (assuming 5 competitions per event)

WITH ranked_comps AS (
  SELECT 
    id,
    event_id,
    ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) as comp_number
  FROM clubhouse_competitions
)
UPDATE clubhouse_competitions c
SET 
  name = CASE 
    WHEN rc.comp_number = 1 THEN 'All 4 Rounds'
    WHEN rc.comp_number = 2 THEN 'Round 1'
    WHEN rc.comp_number = 3 THEN 'Round 2'
    WHEN rc.comp_number = 4 THEN 'Round 3'
    WHEN rc.comp_number = 5 THEN 'Round 4'
    ELSE name
  END,
  description = CASE 
    WHEN rc.comp_number = 1 THEN 'Compete across all four rounds'
    WHEN rc.comp_number = 2 THEN 'First round competition'
    WHEN rc.comp_number = 3 THEN 'Second round competition'
    WHEN rc.comp_number = 4 THEN 'Third round competition'
    WHEN rc.comp_number = 5 THEN 'Fourth round competition'
    ELSE description
  END
FROM ranked_comps rc
WHERE c.id = rc.id;

-- Verify the changes
SELECT 
  ce.name as event_name,
  cc.name as competition_name,
  cc.description,
  cc.entry_credits
FROM clubhouse_competitions cc
JOIN clubhouse_events ce ON ce.id = cc.event_id
ORDER BY ce.created_at, cc.created_at;

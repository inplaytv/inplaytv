-- Fix competition timing to match their actual round start times
-- Bug: All competitions were set to Round 1's start time
-- Fix: Set each competition's start to the first round it covers

-- Update Round 2 competitions
UPDATE clubhouse_competitions
SET 
  starts_at = (
    SELECT round2_tee_time 
    FROM clubhouse_events 
    WHERE id = clubhouse_competitions.event_id
  ),
  closes_at = (
    SELECT round2_tee_time - INTERVAL '15 minutes'
    FROM clubhouse_events 
    WHERE id = clubhouse_competitions.event_id
  )
WHERE rounds_covered = ARRAY[2];

-- Update Round 3 competitions
UPDATE clubhouse_competitions
SET 
  starts_at = (
    SELECT round3_tee_time 
    FROM clubhouse_events 
    WHERE id = clubhouse_competitions.event_id
  ),
  closes_at = (
    SELECT round3_tee_time - INTERVAL '15 minutes'
    FROM clubhouse_events 
    WHERE id = clubhouse_competitions.event_id
  )
WHERE rounds_covered = ARRAY[3];

-- Update Round 4 competitions
UPDATE clubhouse_competitions
SET 
  starts_at = (
    SELECT round4_tee_time 
    FROM clubhouse_events 
    WHERE id = clubhouse_competitions.event_id
  ),
  closes_at = (
    SELECT round4_tee_time - INTERVAL '15 minutes'
    FROM clubhouse_events 
    WHERE id = clubhouse_competitions.event_id
  )
WHERE rounds_covered = ARRAY[4];

-- Verify the fix
SELECT 
  e.name as event_name,
  c.name as competition_name,
  c.rounds_covered,
  c.starts_at,
  c.closes_at,
  CASE 
    WHEN c.rounds_covered = ARRAY[1] THEN e.round1_tee_time
    WHEN c.rounds_covered = ARRAY[2] THEN e.round2_tee_time
    WHEN c.rounds_covered = ARRAY[3] THEN e.round3_tee_time
    WHEN c.rounds_covered = ARRAY[4] THEN e.round4_tee_time
    ELSE e.round1_tee_time
  END as expected_start
FROM clubhouse_competitions c
JOIN clubhouse_events e ON e.id = c.event_id
WHERE e.id = '2c56a37a-5189-4fa8-8456-a871e5f2e9a3'
ORDER BY c.rounds_covered;

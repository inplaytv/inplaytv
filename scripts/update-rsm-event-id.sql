-- Update The RSM Classic with event_id for testing
-- This allows us to test the scoring sync endpoint with a completed tournament that has golfers

UPDATE tournaments 
SET event_id = 'The RSM Classic'
WHERE name LIKE '%RSM%Classic%';

-- Verify the update
SELECT 
    id,
    name,
    status,
    event_id,
    start_date
FROM tournaments
WHERE name LIKE '%RSM%';

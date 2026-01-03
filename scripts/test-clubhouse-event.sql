-- Create a test event for Clubhouse - The Masters 2026
-- Run this entire script in Supabase SQL Editor

DO $$
DECLARE
  event_id_var UUID;
BEGIN
  -- Create the event (trigger will auto-set status to 'open')
  INSERT INTO clubhouse_events (
    name,
    slug,
    location,
    start_date,
    end_date,
    registration_opens_at,
    registration_closes_at
  ) VALUES (
    'The Masters 2026',
    'masters-2026',
    'Augusta National, Georgia',
    '2026-04-09 12:00:00+00',
    '2026-04-12 20:00:00+00',
    '2026-01-01 00:00:00+00',
    '2026-04-08 12:00:00+00'
  ) RETURNING id INTO event_id_var;

  -- Create 3 competitions
  INSERT INTO clubhouse_competitions (
    event_id,
    name,
    description,
    entry_credits,
    prize_credits,
    max_entries,
    opens_at,
    closes_at,
    starts_at
  ) VALUES 
  (
    event_id_var,
    'Full Course',
    'Pick 6 golfers. Best 5 scores count. Lowest total wins!',
    100,
    5000,
    50,
    '2026-01-01 00:00:00+00',
    '2026-04-08 12:00:00+00',
    '2026-04-09 12:00:00+00'
  ),
  (
    event_id_var,
    'Beat The Cut',
    'Pick 6 golfers. How many make the cut?',
    50,
    2500,
    100,
    '2026-01-01 00:00:00+00',
    '2026-04-08 12:00:00+00',
    '2026-04-09 12:00:00+00'
  ),
  (
    event_id_var,
    'Top 10 Finish',
    'Pick 6 golfers. Most top-10 finishes wins!',
    75,
    3500,
    75,
    '2026-01-01 00:00:00+00',
    '2026-04-08 12:00:00+00',
    '2026-04-09 12:00:00+00'
  );

  RAISE NOTICE 'Event created with ID: %', event_id_var;
END $$;

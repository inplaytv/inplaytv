-- ============================================================================
-- Populate Clubhouse Test Data
-- ============================================================================
-- PURPOSE: Insert test events with CORRECT registration timing
-- CORRECT LOGIC: registration_closes_at = 15 minutes before LAST round tee-off
-- RUN THIS: In Supabase SQL Editor
-- ============================================================================

-- Insert Test Events
INSERT INTO clubhouse_events (name, slug, description, venue, location, prize_fund, currency, start_date, end_date, registration_opens_at, registration_closes_at, round1_tee_time, round2_tee_time, round3_tee_time, round4_tee_time, status) VALUES
(
  'Spring Masters Championship',
  'spring-masters-championship',
  'Prestigious spring tournament with challenging course conditions',
  'Augusta National Golf Club',
  'Augusta, GA, USA',
  15000000,
  'USD',
  '2026-01-09 00:00:00+00',  -- Tournament starts (midnight of first day)
  '2026-01-12 23:59:59+00',  -- Tournament ends (end of last round day)
  '2026-01-04 00:00:00+00',
  '2026-01-12 06:45:00+00',  -- 15 minutes before Round 4
  '2026-01-09 07:00:00+00',
  '2026-01-10 07:00:00+00',
  '2026-01-11 07:00:00+00',
  '2026-01-12 07:00:00+00',
  'open'
),
(
  'Desert Classic Open',
  'desert-classic-open',
  'Three-round desert tournament in stunning Arizona landscape',
  'TPC Scottsdale',
  'Scottsdale, AZ, USA',
  8000000,
  'USD',
  '2026-01-15 00:00:00+00',
  '2026-01-17 23:59:59+00',
  '2026-01-08 00:00:00+00',
  '2026-01-17 07:45:00+00',  -- 15 minutes before Round 3 (3-round event)
  '2026-01-15 08:00:00+00',
  '2026-01-16 08:00:00+00',
  '2026-01-17 08:00:00+00',
  NULL,
  'open'
),
(
  'Coastal Links Championship',
  'coastal-links-championship',
  'Traditional links golf by the Pacific Ocean',
  'Pebble Beach Golf Links',
  'Pebble Beach, CA, USA',
  12000000,
  'USD',
  '2026-01-20 00:00:00+00',
  '2026-01-23 23:59:59+00',
  '2026-01-13 00:00:00+00',
  '2026-01-23 08:45:00+00',  -- 15 minutes before Round 4
  '2026-01-20 09:00:00+00',
  '2026-01-21 09:00:00+00',
  '2026-01-22 09:00:00+00',
  '2026-01-23 09:00:00+00',
  'open'
);

-- Insert Competitions for Each Event
WITH event_ids AS (
  SELECT id, registration_opens_at, registration_closes_at, start_date, end_date, round1_tee_time, 
         COALESCE(round4_tee_time, round3_tee_time) as last_round
  FROM clubhouse_events
  WHERE slug IN ('spring-masters-championship', 'desert-classic-open', 'coastal-links-championship')
)
INSERT INTO clubhouse_competitions (event_id, name, description, entry_credits, max_entries, prize_pool_credits, prize_distribution, opens_at, closes_at, starts_at, ends_at, status)
SELECT 
  id,  -- Use 'id' from CTE (will be inserted as event_id)
  comp_name,
  comp_description,
  entry_fee,
  100,  -- max_entries default
  prize_pool,
  '{"1": 50, "2": 30, "3": 20}'::jsonb,
  registration_opens_at,
  registration_closes_at,
  round1_tee_time,
  last_round,
  'open'
FROM event_ids
CROSS JOIN (
  VALUES 
    ('Full Course', 'Play all 6 golfers', 1000, 50000),
    ('Beat The Cut', 'Survive the cut', 500, 20000),
    ('Elite Challenge', 'High stakes competition', 2000, 100000),
    ('Daily Sprint', 'Quick round competition', 250, 5000),
    ('Weekend Warrior', 'Weekend rounds only', 750, 30000)
) AS comps(comp_name, comp_description, entry_fee, prize_pool);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Show all events with their registration windows
SELECT 
  name,
  slug,
  status,
  start_date,
  end_date,
  TO_CHAR(registration_opens_at, 'Mon DD HH24:MI') as reg_opens,
  TO_CHAR(registration_closes_at, 'Mon DD HH24:MI') as reg_closes,
  TO_CHAR(round4_tee_time, 'Mon DD HH24:MI') as round4_time,
  registration_closes_at <= end_date as "Constraint Valid"
FROM clubhouse_events
ORDER BY start_date;

-- Show competition counts per event
SELECT 
  e.name as event_name,
  COUNT(c.id) as competition_count,
  e.status
FROM clubhouse_events e
LEFT JOIN clubhouse_competitions c ON c.event_id = e.id
GROUP BY e.id, e.name, e.status
ORDER BY e.start_date;

-- Verify constraint is correct
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'clubhouse_events'::regclass
  AND conname = 'valid_registration_window';

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
DECLARE
  event_count INTEGER;
  comp_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO event_count FROM clubhouse_events;
  SELECT COUNT(*) INTO comp_count FROM clubhouse_competitions;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CLUBHOUSE TEST DATA POPULATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Events created: %', event_count;
  RAISE NOTICE 'Competitions created: %', comp_count;
  RAISE NOTICE '';
  RAISE NOTICE 'View in Golf App:';
  RAISE NOTICE '  http://localhost:3003/clubhouse/events';
  RAISE NOTICE '';
  RAISE NOTICE 'View in Admin Panel:';
  RAISE NOTICE '  http://localhost:3002/clubhouse/events';
  RAISE NOTICE '';
  RAISE NOTICE 'All events use CORRECT registration timing:';
  RAISE NOTICE '  Registration closes 15 min before LAST round';
  RAISE NOTICE '========================================';
END $$;

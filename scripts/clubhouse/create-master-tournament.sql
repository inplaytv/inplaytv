-- Create Clubhouse Master Tournament
-- This tournament exists ONLY for managing golfers/groups for clubhouse events
-- It's never shown to users - just an admin utility
-- UUID: 00000000-0000-0000-0000-000000000001

DO $$
DECLARE
  master_tournament_id UUID := '00000000-0000-0000-0000-000000000001';
  master_tournament_exists BOOLEAN;
BEGIN
  -- Check if it already exists
  SELECT EXISTS(SELECT 1 FROM tournaments WHERE id = master_tournament_id) INTO master_tournament_exists;
  
  IF NOT master_tournament_exists THEN
    -- Create the master tournament
    INSERT INTO tournaments (
      id,
      name,
      slug,
      description,
      location,
      start_date,
      end_date,
      registration_opens_at,
      registration_closes_at,
      status,
      created_at,
      updated_at
    ) VALUES (
      master_tournament_id,
      'Clubhouse Master Tournament',
      'clubhouse-master',
      'Internal tournament for managing clubhouse golfers. Not visible to users.',
      'Admin Only',
      '2025-01-01 00:00:00+00',
      '2025-12-31 23:59:59+00',
      '2025-01-01 00:00:00+00',
      '2025-12-31 23:59:59+00',
      'draft',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Clubhouse Master Tournament created with ID: %', master_tournament_id;
  ELSE
    RAISE NOTICE 'Clubhouse Master Tournament already exists';
  END IF;
END $$;

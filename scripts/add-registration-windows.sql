ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz;

COMMENT ON COLUMN tournaments.registration_opens_at IS 'When registration opens for this tournament';
COMMENT ON COLUMN tournaments.registration_closes_at IS 'When registration closes for this tournament';

CREATE INDEX IF NOT EXISTS idx_tournaments_registration_windows 
ON tournaments(registration_opens_at, registration_closes_at) 
WHERE registration_opens_at IS NOT NULL;

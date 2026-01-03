-- Add round tee times to clubhouse events
-- This allows automatic creation of round-specific competitions

-- Add tee time columns
ALTER TABLE clubhouse_events
ADD COLUMN IF NOT EXISTS round1_tee_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round2_tee_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round3_tee_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round4_tee_time TIMESTAMPTZ;

-- Add rounds_covered column to competitions
ALTER TABLE clubhouse_competitions
ADD COLUMN IF NOT EXISTS rounds_covered INTEGER[];

-- Add index for querying by rounds
CREATE INDEX IF NOT EXISTS idx_clubhouse_competitions_rounds 
ON clubhouse_competitions USING GIN(rounds_covered);

-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clubhouse_events'
AND column_name LIKE 'round%_tee_time'
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clubhouse_competitions'
AND column_name = 'rounds_covered';
